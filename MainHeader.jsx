/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import Link from 'next/link';
import ActiveLink from 'ui/components/ActiveLink';
import LocationsMenu from 'ui/components/LocationsMenu/LocationsMenu';
import { withTranslation } from 'react-i18next';
import { routes } from 'env/routes';
import { withRouter } from 'next/router';
import withCustomComponent from 'ui/components/withCustomComponent';
import { ReferralNotice } from 'ui/_pages/home/ReferralModal/ReferralNotice';
import { CustomerInactiveNotice } from 'ui/components/Header/CustomerInactiveNotice';
import { ReferralModal } from 'ui/_pages/home/ReferralModal/ReferralModal';
import { ImpersonationNotice } from 'ui/components/Header/ImpersonationNotice';
import { AdminNotice } from 'ui/components/AdminNotice';
import { NotificationsMenuItem } from 'ui/components/Header/NotificationsMenuItem';
import _ from 'lodash';

@withCustomComponent('MainHeader')
@withTranslation()
@withRouter
@inject(
  'contentStore',
  'authStore',
  'appStore',
  'authStore',
  'floorPlanStore',
  'bookingsStore',
  'checkoutStore',
  'coursesStore'
)
@observer
class MainHeader extends Component {
  constructor(props) {
    super(props);

    this.state = {
      wiggleCart: false,
      basketCount: props.checkoutStore.basket.length,
    };
  }

  initToolTips = () => {
    const $ = window.$;
    $('[data-toggle="tooltip"]').tooltip('dispose');
    $('[data-toggle="tooltip"]').tooltip({
      html: true,
    });
  };

  componentDidUpdate(prevProps, prevState) {
    const currentBasketCount = this.props.checkoutStore.basket.length;
    if (prevState.basketCount != currentBasketCount) {
      this.setState({ wiggleCart: true, basketCount: currentBasketCount });
      setTimeout(() => this.setState({ wiggleCart: false }), 3000);
    }
  }

  changeProfile(coworkerId) {
    const { authStore } = this.props;
    authStore.selectProfile(coworkerId);
  }

  componentDidMount() {
    this.initToolTips();
    const {
      bookingsStore,
      appStore,
      floorPlanStore,
      contentStore,
      coursesStore,
      authStore,
      router,
    } = this.props;

    if (!authStore.hasLoadedProfiles)
      authStore.loadProfiles().catch(() => null);
    if (!bookingsStore.hasLoadedResources)
      bookingsStore.loadResources().catch(() => null);
    if (!appStore.hasLoadedReferralDiscounts)
      appStore.loadReferralDiscounts().catch((ex) => null);
    if (!contentStore.hasLoadedFaqArticles)
      contentStore.loadFaqArticles().catch((ex) => null);
    if (!contentStore.hasLoadedCommunityPerks)
      contentStore.loadCommunityPerks().catch((ex) => null);
    if (!floorPlanStore.hasLoadedItems)
      floorPlanStore.loadItems().catch((ex) => null);

    if (!coursesStore.hasLoadedCoursesPage)
      coursesStore.loadCoursesPage({ ...router.query }).catch((ex) => null);
  }

  render() {
    const {
      bookingsStore,
      checkoutStore,
      coursesStore,
      t,
      router,
      appStore,
      authStore,
    } = this.props;

    const {
      publicCustomPages,
      referralDiscounts,
      business,
      configuration,
      showNotices,
      corporateDashboard,
    } = appStore;
    const { isLoggedIn, impersonationToken, customer } = authStore;
    const { resources, resourceGroups } = bookingsStore;
    // move 'All Resources' group to first element
    if (
      resourceGroups.length &&
      resourceGroups[resourceGroups.length - 1].groupName === null
    ) {
      const allResourcesGroup = resourceGroups.pop();
      resourceGroups.unshift(allResourcesGroup);
    }

    if (!business) return <></>;

    const config = appStore.configuration;

    const impersonationTokens = impersonationToken;
    const customerIsInactive = customer && customer.Id > 0 && !customer.Active;
    const showDiscounts =
      referralDiscounts.length > 0 && customer && !customerIsInactive;
    const isAdmin = authStore.me?.CanAccessPlatform;

    const clearNotices = () => {
      const { appStore } = this.props;

      appStore.setShowNotices(false);
    };

    const bottomContent =
      showNotices &&
      (impersonationTokens || customerIsInactive || showDiscounts || isAdmin);

    return (
      <>
        {appStore.showReferralModal && <ReferralModal />}
        <header
          data-component-name={this.props.componentName}
          className={`site-header ${
            isLoggedIn ? 'site-header--li' : 'site-header--lo'
          } ${bottomContent ? 'site-header--with-bottom-content' : ''}`}
        >
          {isLoggedIn ? (
            <div className="site-header__content">
              {/*  HEADER - Logged In */}
              <div className="site-header__content--left">
                <button
                  onClick={() => appStore.toggleMainMenuExpanded()}
                  className="toggle-mobile"
                >
                  <i className="icon-menu"></i>
                </button>
                <Link href={routes.home}>
                  <a className="brand">
                    <img
                      src={`${business.NativeHomeUrlWithLanguage}/business/getlogo?h=144&mode=pad`}
                      alt={t(business.Name)}
                    />
                  </a>
                </Link>
                <LocationsMenu showCurrent={true} />
              </div>
              <div className="site-header__content--right">
                <ActiveLink href={routes.checkout}>
                  <a
                    className="btn btn-single-icon btn-white-black mr-4 checkout"
                    aria-label={t('Cart')}
                  >
                    <i className="icon-cart"></i>
                    {checkoutStore.basket.length > 0 && (
                      <span
                        className={`badge ${
                          this.state.wiggleCart ? 'wiggle' : ''
                        }`}
                      >
                        {_.sumBy(checkoutStore.basket, (i) =>
                          parseInt(i.data?.Quantity ?? '1')
                        )}
                      </span>
                    )}
                  </a>
                </ActiveLink>

                {configuration['PublicWebSite.CommunityBoard'] && (
                  <ActiveLink href={routes.private_threads}>
                    <a className="btn btn-single-icon btn-white-black mr-4 inbox">
                      <i className="icon-inbox"></i>
                    </a>
                  </ActiveLink>
                )}

                <NotificationsMenuItem />
                <div className="customer dropdown">
                  <button
                    className="btn btn-white-black dropdown-toggle"
                    data-toggle="dropdown"
                  >
                    <img
                      src={`${business.NativeHomeUrlWithLanguage}/coworker/getavatar/${customer.Id}?cache=${customer.UpdatedOn}&h=32&w=32&noavatar=%2Fcontent%2Fthemes%2Fpublic%2Fdos%2Fimg%2Favatar-default.png`}
                      id="Customer_Avatar_Img"
                      className="avatar"
                      alt={customer.FullName}
                    />
                    <span className="fs-16 pl-12">
                      {customer.CoworkerType == 'Individual'
                        ? customer.FullName
                        : customer.CompanyName}
                    </span>
                    <span className="caret"></span>
                  </button>
                  <div className="dropdown-menu">
                    {resources.length > 0 && (
                      <ActiveLink href={routes.my_bookings}>
                        <a className="dropdown-item">{t('My bookings')}</a>
                      </ActiveLink>
                    )}
                    {configuration['PublicWebSite.MyAccount'] && (
                      <ActiveLink href={routes.profile}>
                        <a className="dropdown-item">{t('My account')}</a>
                      </ActiveLink>
                    )}

                    {!corporateDashboard && (
                      <ActiveLink href={routes.plan}>
                        <a className="dropdown-item">
                          {t('Plans and benefits')}
                        </a>
                      </ActiveLink>
                    )}
                    {!corporateDashboard &&
                      configuration['Members.ViewInvoices'] && (
                        <ActiveLink href={routes.invoices}>
                          <a className="dropdown-item">{t('Billing')}</a>
                        </ActiveLink>
                      )}
                    {authStore.profiles.length > 1 && (
                      <>
                        <hr className="mt-5 mb-5" />
                        {authStore.profiles.map((p) => (
                          <a
                            title={t('Change your current profile')}
                            href="#"
                            onClick={() => this.changeProfile(p.Id)}
                            className={`${
                              customer.Id == p.Id ? 'active' : ''
                            } mb-5 dropdown-item`}
                          >
                            <img
                              src={`${business.NativeHomeUrlWithLanguage}/coworker/getavatar/${p.Id}?cache=${p.UpdatedOn}&h=32&w=32&noavatar=%2Fcontent%2Fthemes%2Fpublic%2Fdos%2Fimg%2Favatar-default.png`}
                              className="avatar mr-5"
                              alt={p.FullName}
                            />
                            <span>
                              {p.CoworkerType == 1 ? p.FullName : p.CompanyName}
                            </span>
                          </a>
                        ))}
                        <hr className="mt-5 mb-5" />
                      </>
                    )}
                    <button
                      className="dropdown-item"
                      onClick={() => authStore.logout()}
                    >
                      <i className="icon-log-out"></i>
                      {t('Log out')}
                    </button>
                  </div>
                </div>
              </div>
              {/*  END HEADER - Logged In */}
            </div>
          ) : (
            <>
              <div
                className="site-header__shadow navbar-toggler collapse"
                id="shadow"
                data-toggle="collapse"
                data-target="#navbarSupportedContent,#shadow"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
              ></div>

              <div className="site-header__content">
                {/*  HEADER - Logged Out */}
                <nav className="navbar navbar-expand-lg">
                  <Link href={routes.home}>
                    <a className="navbar-brand">
                      <img
                        src={`${business.NativeHomeUrlWithLanguage}/business/getlogo?h=192&mode=pad`}
                        alt={t(business.Name)}
                        height="48"
                      />
                    </a>
                  </Link>

                  <div className="d-flex align-items-center">
                    <Link href={routes.checkout}>
                      <a
                        className="btn btn-single-icon btn-white d-lg-none d-inline-flex p-8 mr-8"
                        aria-label={t('Cart')}
                      >
                        <i className="icon-cart" />
                        {checkoutStore.basket.length > 0 && (
                          <span className="badge">
                            {checkoutStore.basket.length}
                          </span>
                        )}
                      </a>
                    </Link>

                    <button
                      className="navbar-toggler"
                      type="button"
                      data-toggle="collapse"
                      data-target="#navbarSupportedContent,#shadow"
                      aria-controls="navbarSupportedContent"
                      aria-expanded="false"
                      aria-label="Toggle navigation"
                    >
                      <i className="icon-menu"></i>
                    </button>
                  </div>

                  <div
                    className="collapse navbar-collapse"
                    id="navbarSupportedContent"
                  >
                    <ul className="navbar-nav mr-auto">
                      {config['PublicWebSite.AboutUs'] && (
                        <li className="nav-item">
                          <Link href={routes.about}>
                            <a className="nav-link" href="#">
                              {t('Why {{businessName}}', {
                                businessName: t(business.Name),
                              })}
                            </a>
                          </Link>
                        </li>
                      )}

                      <LocationsMenu
                        showCurrent={false}
                        btnClassName="nav-link"
                        hideIcon={true}
                      />

                      {(config['Blog.Enabled'] ||
                        config['PublicWebSite.Events'] ||
                        config['PublicWebSite.Directory'] ||
                        config['Jitsi.AlwaysOnRooms.Enabled'] ||
                        publicCustomPages.length > 0) && (
                        <li
                          className="nav-item dropdown"
                          id={`nav-community-menu`}
                        >
                          <a
                            href="#"
                            className="nav-link dropdown-toggle"
                            data-toggle="dropdown"
                            role="button"
                            aria-haspopup="true"
                            aria-expanded="false"
                          >
                            {t('Community')} <span className="caret"></span>
                          </a>
                          <ul className="dropdown-menu" role="menu">
                            {config['Blog.Enabled'] && (
                              <li
                                id={`nav-blog-menu`}
                                className={
                                  router.pathname.indexOf(routes.posts) > -1
                                    ? 'active'
                                    : ''
                                }
                              >
                                <Link href={routes.posts}>
                                  <a className="dropdown-item">
                                    {t('Articles')}
                                  </a>
                                </Link>
                              </li>
                            )}
                            {config['PublicWebSite.Events'] && (
                              <li
                                id={`nav-events-menu`}
                                className={
                                  router.pathname.indexOf(routes.events) > -1
                                    ? 'active'
                                    : ''
                                }
                              >
                                <Link href={routes.events}>
                                  <a className="dropdown-item">{t('Events')}</a>
                                </Link>
                              </li>
                            )}
                            {coursesStore.coursesPage?.Courses?.length > 0 && (
                              <li id={`nav-events-courses`}>
                                <Link href={routes.courses}>
                                  <a
                                    className={`dropdown-item ${
                                      router.pathname.indexOf(routes.courses) >
                                      -1
                                        ? 'active'
                                        : ''
                                    }`}
                                  >
                                    {t('Courses')}
                                  </a>
                                </Link>
                              </li>
                            )}
                            {config['PublicWebSite.Directory'] && (
                              <li
                                id={`nav-directory-menu`}
                                className={
                                  router.pathname ===
                                    routes.directory_members ||
                                  router.pathname === routes.directory_teams
                                    ? 'active'
                                    : ''
                                }
                              >
                                <Link
                                  href={
                                    config['Directory.DirectoryRecords'] == 2
                                      ? routes.directory_teams
                                      : routes.directory_members
                                  }
                                >
                                  <a className="dropdown-item">
                                    {t('Directory')}
                                  </a>
                                </Link>
                              </li>
                            )}
                            {config['Jitsi.AlwaysOnRooms.Enabled'] && (
                              <li
                                id={`nav-virtual-rooms-menu`}
                                className={
                                  router.pathname.indexOf(
                                    routes.virtual_rooms
                                  ) > -1
                                    ? 'active'
                                    : ''
                                }
                              >
                                <Link href={routes.virtual_rooms}>
                                  <a className="dropdown-item">
                                    {t('Virtual rooms')}
                                  </a>
                                </Link>
                              </li>
                            )}
                            {publicCustomPages.map((page, i) => (
                              <li
                                id={`nav-custom-page-${page.Id}`}
                                key={i}
                                className={`${
                                  router.pathname === routes.custom_page &&
                                  router.query.page_name == page.Permalink
                                    ? 'active'
                                    : ''
                                }`}
                              >
                                <Link
                                  as={routes.custom_page(page.Permalink)}
                                  href={routes.custom_page('[...page_slug]')}
                                >
                                  <a className="dropdown-item">
                                    {t(page.Title || page.Name)}
                                  </a>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      )}

                      {config['PublicWebSite.Tour'] &&
                        appStore.coworkingDashboard && (
                          <li className="nav-item">
                            <Link href={routes.tour}>
                              <a className="nav-link">{t('Take a tour')}</a>
                            </Link>
                          </li>
                        )}

                      {resources.length > 0 && (
                        <>
                          {resourceGroups.length == 1 && (
                            <li className="nav-item">
                              <Link href={routes.resources}>
                                <a className="nav-link">{t('Bookings')}</a>
                              </Link>
                            </li>
                          )}
                          {resourceGroups.length > 1 && (
                            <li
                              className="nav-item dropdown"
                              id={`nav-community-menu`}
                            >
                              <a
                                href="#"
                                className="nav-link dropdown-toggle"
                                data-toggle="dropdown"
                                role="button"
                                aria-haspopup="true"
                                aria-expanded="false"
                              >
                                {t('Bookings')} <span className="caret"></span>
                              </a>
                              <ul className="dropdown-menu" role="menu">
                                {resourceGroups.map((group) => (
                                  <li
                                    className="nav-item"
                                    key={group.groupName}
                                  >
                                    <Link
                                      href={`${routes.resources}?group=${
                                        group.groupName ?? ''
                                      }`}
                                    >
                                      <a className="nav-link">
                                        {t(group.groupName) ||
                                          t('All Resources')}
                                      </a>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          )}
                        </>
                      )}
                    </ul>

                    <ul className="navbar-nav navbar-action">
                      <li className="nav-item">
                        <Link href={routes.checkout}>
                          <a
                            className="btn btn-single-icon btn-white d-none d-lg-inline-flex"
                            aria-label={t('Cart')}
                          >
                            <i className="icon-cart" />
                            {checkoutStore.basket.length > 0 && (
                              <span className="badge">
                                {checkoutStore.basket.length}
                              </span>
                            )}
                          </a>
                        </Link>
                      </li>

                      <li className="spacer"></li>

                      <li className="nav-item mx-4">
                        <Link href={routes.login}>
                          <a
                            className="btn btn-outline"
                            id={`nav-sign-in-menu`}
                          >
                            {t('Sign in')}
                          </a>
                        </Link>
                      </li>

                      {config['PublicWebSite.Tour'] && (
                        <li className="nav-item mx-4">
                          <Link href={routes.tour}>
                            <a className="btn" id={`nav-sign-up-menu`}>
                              <span className="d-none d-xl-inline">
                                {t('Tour the space')}
                              </span>
                              <span className="d-inline d-xl-none">
                                {t('Tour the space')}
                              </span>
                            </a>
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                </nav>
                {/*  END HEADER - Logged Out */}
              </div>
            </>
          )}

          {bottomContent && (
            <div className="site-header__bottom-content">
              {impersonationTokens && <ImpersonationNotice />}
              {customerIsInactive && <CustomerInactiveNotice />}
              {showDiscounts && <ReferralNotice />}

              {!customerIsInactive &&
                !impersonationTokens &&
                !showDiscounts && <>{isAdmin && <AdminNotice />}</>}

              <button className="clear-notices" onClick={clearNotices}>
                <i className="icon-close"></i>
              </button>
            </div>
          )}
        </header>
      </>
    );
  }
}
export default MainHeader;
