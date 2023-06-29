import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { PropTypes } from 'prop-types';
import Link from 'next/link';
import { withTranslation } from 'react-i18next';
import { withRouter } from 'next/router';
import withCustomComponent from 'ui/components/withCustomComponent';
import _ from 'lodash';
class LocationItem extends Component {
  static propTypes = {
    location: PropTypes.object.isRequired,
    currentBusiness: PropTypes.object.isRequired,
    prefix: PropTypes.string,
  };

  render() {
    const { router, currentBusiness, location, level } = this.props;

    return (
      <>
        <a
          className="dropdown-item"
          href={location.HomeUrl + router.asPath.replace('?public', '?')}
        >
          {currentBusiness.Id == location.Id ? (
            <>
              <span className="text-gray-900">{location.Name}</span>
              <i className="icon-check fs-24 mr-0 ml-12 text-gray-900"></i>
            </>
          ) : (
            <span>{location.Name}</span>
          )}
        </a>
        {location.businesses &&
          location.businesses.map((b, i) => (
            <LocationItem
              router={router}
              key={i}
              level={level + 1}
              location={b}
              currentBusiness={currentBusiness}
            />
          ))}
      </>
    );
  }
}

@withCustomComponent('LocationsMenu')
@withRouter
@withTranslation()
@inject('appStore')
@observer
class LocationsMenu extends Component {
  componentDidMount() {
    const { t, appStore } = this.props;

    appStore.loadBusinesses(true);
  }

  render() {
    const {
      router,
      t,
      appStore,
      className,
      showCurrent,
      btnClassName,
      hideIcon,
      hideCaret,
    } = this.props;
    const { business, businessesTree, businesses } = appStore;

    if (businesses.length <= 1)
      return (
        <>
          {showCurrent && (
            <div className="locations-menu dropdown">
              <Link href="/">
                <a
                  className={`${
                    btnClassName ? btnClassName : 'btn btn-white-black btn-icon'
                  } dropdown-toggle`}
                >
                  {hideIcon ? (
                    <></>
                  ) : (
                    <i className="icon-marker-pin-circle"></i>
                  )}
                  <span className="text">
                    {t('{{Name}}', { Name: t(business.Name) })}
                  </span>
                </a>
              </Link>
            </div>
          )}
        </>
      );

    return (
      <div
        data-component-name={this.props.componentName}
        className={`locations-menu dropdown ${className ? className : ''}`}
      >
        <button
          className={`${
            btnClassName ? btnClassName : 'btn btn-white-black btn-icon'
          } dropdown-toggle`}
          data-toggle="dropdown"
          role="button"
          aria-haspopup="true"
          aria-expanded="false"
        >
          {hideIcon ? <></> : <i className="icon-marker-pin-circle"></i>}
          <span className="text">
            {showCurrent
              ? t('{{Name}}', { Name: t(business.Name) })
              : t('Locations')}{' '}
          </span>
          {hideCaret ? <></> : <span className="caret"></span>}
        </button>
        {businesses.length > 1 && (
          <div className="dropdown-menu" role="menu">
            {businessesTree.map((thisBusiness, i) => (
              <LocationItem
                router={router}
                level={0}
                key={i}
                location={thisBusiness}
                currentBusiness={business}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default LocationsMenu;
