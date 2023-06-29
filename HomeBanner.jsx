import React from 'react';
import Link from 'next/link';
import { routes } from 'env/routes';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'next/router';
import { inject, observer } from 'mobx-react';
import withCustomComponent from 'ui/components/withCustomComponent';

export const HomeBanner = withCustomComponent('HomeBanner')(
  inject('appStore')(
    withRouter(
      observer(({ componentName, appStore }) => {
        const { t } = useTranslation();
        const { configuration, business, homePage } = appStore;
        const imageIndex = Math.floor(Math.random() * homePage.Gallery.length);
        const imgUrl =
          homePage.Gallery.length == 0
            ? `${business.NativeHomeUrl}/content/themes/public/dos/img/cover-example-2.jpg`
            : `${business.NativeHomeUrl}${homePage.Gallery[imageIndex].Url}?w=1500&h=750`;
        const isVirtualDashboard = appStore.virtualDashboard;

        return (
          <div
            data-component-name={componentName}
            className={`home-banner ${
              isVirtualDashboard ? 'home-banner--virtual' : ''
            }`}
          >
            <div className="home-banner-container container">
              <div className="home-banner__text">
                <h1>
                  {t(
                    configuration['HomePage.BannerText'].replace(
                      '{0}',
                      t(business.Name)
                    )
                  )}
                </h1>

                <p>{t(configuration['HomePage.BannerSmallText'])}</p>

                {configuration['Members.CanSignup'] && (
                  <Link href={routes.signup}>
                    <a href="#" className="btn btn-lg">
                      {t('Become a member')}
                    </a>
                  </Link>
                )}

                <div className="sign-in">
                  <span className='text-gray-700'>{t('Already in?')}</span>
                  <Link href={routes.login}>
                    <a>{t('Sign in here')}</a>
                  </Link>
                </div>
              </div>
              <div className="home-banner__image">
                <div
                  className="img"
                  style={{ backgroundImage: `url(${encodeURI(imgUrl)})` }}
                ></div>
              </div>
            </div>
          </div>
        );
      })
    )
  )
);
