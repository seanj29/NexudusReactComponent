import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import { observer, inject } from 'mobx-react';
import _ from 'lodash';
import { withTranslation } from 'react-i18next';
import { shouldShowField } from 'ui/components/forms/formFieldHelpers';
import MarkdownInputField from 'ui/components/forms/MarkdownInputField';
import TagsInputField from 'ui/components/forms/TagsInputField';
import BooleanInputField from 'ui/components/forms/BooleanInputField';
import ActionButton from 'ui/components/forms/ActionButton';
import InputField from 'ui/components/forms/InputField';
import asForm from 'ui/components/forms/asForm';
import Link from 'next/link';
import { routes } from 'env/routes';
import withCustomComponent from 'ui/components/withCustomComponent';

@withCustomComponent('ProfessionalProfileSection')
@withTranslation()
@inject('appStore', 'authStore')
@observer
class ProfessionalProfileSection extends Component {
  static propTypes = {
    customer: PropTypes.object.isRequired,
  };

  componentDidMount() {
    const { appStore } = this.props;
  }

  shouldShowFieldWithCustomer = (fieldName) => {
    const { customer, appStore } = this.props;
    const { configuration } = appStore;

    return shouldShowField(configuration, fieldName, customer);
  };

  showStarIfRequired = (group, fieldName) => {
    const { appStore } = this.props;
    const { configuration } = appStore;
    return configuration[`${group}.${fieldName}`] === '2' ? '*' : '';
  };

  render() {
    const {
      t,
      hideTitle,
      appStore,
      authStore,
      customer,
      saveCustomer,
      updateProperty,
    } = this.props;

    const { profileTags } = appStore;
    const { business, configuration } = appStore;
    const isNewCustomer = !customer.Id > 0;
    const shouldShowProfileForm =
      !isNewCustomer ||
      (configuration['SignupForm.ShowProfileSection'] &&
        (this.shouldShowFieldWithCustomer('CompanyName') ||
          this.shouldShowFieldWithCustomer('BusinessArea') ||
          this.shouldShowFieldWithCustomer('Position') ||
          this.shouldShowFieldWithCustomer('ProfileSummary') ||
          this.shouldShowFieldWithCustomer('PorfileTags')));

    if (!shouldShowProfileForm) return null;

    //Group the tags in groups of 3. This helps with the layout below
    var groupedTags = _(profileTags)
      .groupBy(function (element) {
        const index = profileTags.indexOf(element);
        return Math.floor(index / 2);
      })
      .toArray()
      .value();

    return (
      <div className="card card-dashboard mb-32">
        <fieldset
          componentName={this.props.componentName}
          id="professional-profile"
        >
          {!hideTitle && (
            <h5 className="section__title">{t('Professional profile')}</h5>
          )}

          {this.shouldShowFieldWithCustomer('CompanyName') && (
            <div className="row">
              <div className="form-group col-12 ">
                <InputField
                  id="customer-companyName"
                  label={
                    t('Company Name') +
                    this.showStarIfRequired('Forms', 'CompanyName')
                  }
                  name="CompanyName"
                  errors={authStore.customerValidation.errors.CompanyName}
                  value={customer.CompanyName}
                  onChange={updateProperty}
                />
              </div>
            </div>
          )}

          <div className="row">
            {this.shouldShowFieldWithCustomer('BusinessArea') && (
              <div className="form-group col-md-6 ">
                <InputField
                  id="customer-industry"
                  label={
                    t('Industry') +
                    this.showStarIfRequired('Forms', 'BusinessArea')
                  }
                  name="BusinessArea"
                  errors={authStore.customerValidation.errors.BusinessArea}
                  value={customer.BusinessArea}
                  onChange={updateProperty}
                />
              </div>
            )}
            {this.shouldShowFieldWithCustomer('Position') && (
              <div className="form-group col-md-6 ">
                <InputField
                  id="customer-position"
                  label={
                    t('Your Role / Position') +
                    this.showStarIfRequired('Forms', 'Position')
                  }
                  name="Position"
                  errors={authStore.customerValidation.errors.Position}
                  value={customer.Position}
                  onChange={updateProperty}
                />
              </div>
            )}
          </div>

          {this.shouldShowFieldWithCustomer('ProfileSummary') && (
            <div className="row">
              <div className="form-group col-sm-12 ">
                <MarkdownInputField
                  id="customer-summary"
                  label={
                    t('Your profile / bio') +
                    this.showStarIfRequired('Forms', 'ProfileSummary')
                  }
                  name="ProfileSummary"
                  errors={authStore.customerValidation.errors.ProfileSummary}
                  value={customer.ProfileSummary}
                  onChange={updateProperty}
                />
                <small className="help-block">
                  {t('You can use MarkDown syntax to give format to your bio')}
                </small>
              </div>
            </div>
          )}

          {profileTags.length == 0 &&
            this.shouldShowFieldWithCustomer('PorfileTags') && (
              <div className="row">
                <div className="form-group col-12 ">
                  <TagsInputField
                    id="customer-tags"
                    label={
                      t('Your skills') +
                      this.showStarIfRequired('Forms', 'PorfileTags')
                    }
                    name="ProfileTags"
                    errors={authStore.customerValidation.errors.ProfileTags}
                    value={customer.ProfileTags}
                    onChange={(name, value) => {
                      updateProperty(name, value);
                      updateProperty('ProfileTagsList', value.split(','));
                    }}
                  />
                </div>
              </div>
            )}

          {profileTags.length > 0 &&
            this.shouldShowFieldWithCustomer('PorfileTags') && (
              <div className="row">
                <div className="col-12">
                  <div className="form-group">
                    <label className="control-label mb-8" htmlFor="ProfileTags">
                      {t('Your skills') +
                        this.showStarIfRequired('Forms', 'PorfileTags')}
                    </label>
                    {groupedTags.map((group, g) => (
                      <div key={g} className="row">
                        {group.map((tag, i) => (
                          <div key={i} className="col-md-6">
                            <div
                              className="custom-control custom-checkbox"
                              key={i}
                            >
                              <input
                                type="checkbox"
                                className="custom-control-input"
                                id={tag}
                                name={tag}
                                onChange={(ev) =>
                                  ev.target.checked
                                    ? updateProperty('ProfileTagsList', [
                                        ...customer.ProfileTagsList,
                                        tag.toLowerCase(),
                                      ])
                                    : updateProperty(
                                        'ProfileTagsList',
                                        _.without(
                                          customer.ProfileTagsList,
                                          tag.toLowerCase()
                                        )
                                      )
                                }
                                checked={
                                  customer.ProfileTagsList &&
                                  customer.ProfileTagsList.indexOf(
                                    tag.toLowerCase()
                                  ) > -1
                                }
                              />
                              <label
                                className="custom-control-label fs-14"
                                htmlFor={tag}
                              >
                                {t(tag)}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          {!hideTitle && (
            <h5 className="section__title mt-24">{t('Profile privacy')}</h5>
          )}

          <div className="form-group">
            <BooleanInputField
              id="customer-profileIsPublic"
              label={t('Include my profile in the directory.')}
              labelClassName={'fs-14 text-gray-700'}
              name="ProfileIsPublic"
              errors={authStore.customerValidation.errors.ProfileIsPublic}
              value={customer.ProfileIsPublic}
              onChange={updateProperty}
            />
          </div>

          {!customer.ProfileIsPublic && (
            <div className="alert alert-warning fs-14" role="alert">
              <strong>{t('Heads up!')}</strong>
              <br />
              {t(
                "Your profile won't be listed in the directory! Enable the option 'Include my profile in the members directory' for other members to see your profile in the members directory. Your email and personal contact details are never displayed on the site."
              )}
            </div>
          )}
          {customer.ProfileIsPublic && (
            <div className="alert alert-success fs-14" role="alert">
              <strong>{t('Great!')}</strong>
              <br />
              {t(
                'Your professional profile will be listed in the members directory. Your email and personal contact details are never displayed on the site.'
              )}
            </div>
          )}

          {saveCustomer && (
            <div className="d-flex align-items-center mt-24">
              <ActionButton
                action={() => saveCustomer()}
                busy={authStore.isSavingCustomerWithUser}
              />
              <Link
                as={{
                  pathname: routes.directory_member_by_id(customer),
                }}
                href={{
                  pathname: routes.directory_member_by_id('[member_id]'),
                }}
              >
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-gray btn-sm ml-8"
                >
                  {t('View my profile')}
                </a>
              </Link>
            </div>
          )}
        </fieldset>
      </div>
    );
  }
}
export default asForm(ProfessionalProfileSection, 'customer');
