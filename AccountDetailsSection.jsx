import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { toJS } from 'mobx';
import { withTranslation } from 'react-i18next';
import InputField from 'ui/components/forms/InputField';
import SelectField from 'ui/components/forms/SelectField';
import FileInputField from 'ui/components/forms/FileInputField';
import DateInputField from 'ui/components/forms/DateInputField';
import Link from 'next/link';
import { routes } from 'env/routes';
import TextAreaInputField from 'ui/components/forms/TextAreaInputField';
import CountrySelectField from 'ui/components/forms/CountrySelectField';
import ActionButton from 'ui/components/forms/ActionButton';
import asForm from 'ui/components/forms/asForm';
import { shouldShowField } from 'ui/components/forms/formFieldHelpers';
import { reactionWithOldValue } from 'env/utils/reactionWithOldValue';
import withCustomComponent from 'ui/components/withCustomComponent';
import moment from 'moment';

@withCustomComponent('AccountDetailsSection')
@withTranslation()
@inject('appStore', 'authStore')
@observer
class AccountDetailsSection extends Component {
  static propTypes = {
    customer: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      userAlreadyExists: false,
      shouldShowContactForm: false,
    };
  }

  componentDidMount() {
    this.emailReactionDisposer = reactionWithOldValue(
      () => toJS(this.props.authStore.customer),
      (customer, oldCustomer) => {
        if (oldCustomer && customer.Email !== oldCustomer.Email) {
          this.props.authStore.exists(customer.Email).then((exists) => {
            if (customer.Email === this.props.authStore.customer.Email)
              this.setState({ userAlreadyExists: exists });
          });
        }
      },
      { delay: 750 }
    );

    const { appStore } = this.props;
    const shouldShowContactForm =
      appStore.configuration['SignupForm.ShowContactSection'] == 'true' &&
      (this.shouldShowFieldWithCustomer('Address') ||
        this.shouldShowFieldWithCustomer('Country') ||
        this.shouldShowFieldWithCustomer('State') ||
        this.shouldShowFieldWithCustomer('CityName') ||
        this.shouldShowFieldWithCustomer('PostCode') ||
        this.shouldShowFieldWithCustomer('BillingName') ||
        this.shouldShowFieldWithCustomer('TaxIDNumber') ||
        this.shouldShowFieldWithCustomer('ProfileWebsite'));

    this.setState({ shouldShowContactForm });
  }

  componentWillUnmount() {
    this.emailReactionDisposer();
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
      hideTitle,
      editableEmail,
      appStore,
      t,
      saveCustomer,
      authStore,
      customer,
      updateProperty,
    } = this.props;
    const { userAlreadyExists, existingUserUniqueId, customerValidation } =
      authStore;
    const { configuration } = appStore;

    return (
      <>
        <div className="card card-dashboard mb-32">
          <fieldset
            data-component-name={this.props.componentName}
            id="account-details"
          >
            {!hideTitle && (
              <h5 className="section__title">{t('Personal details')}</h5>
            )}
            {!userAlreadyExists && (
              <>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <InputField
                        id="customer-fullname"
                        label={t('Full name') + '*'}
                        name="FullName"
                        errors={customerValidation.errors.FullName}
                        value={customer.FullName}
                        onChange={updateProperty}
                        autocomplete="name"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <InputField
                        id="customer-salutation"
                        label={t('What should we call you?') + '*'}
                        name="Salutation"
                        errors={customerValidation.errors.Salutation}
                        value={customer.Salutation}
                        onChange={updateProperty}
                        autocomplete="honorific-prefix"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  {this.shouldShowFieldWithCustomer('LandLine') && (
                    <div className="form-group col-md-6">
                      <InputField
                        id="customer-landline"
                        label={
                          t('Phone number') +
                          this.showStarIfRequired('SignupForm', 'LandLine')
                        }
                        name="LandLine"
                        errors={customerValidation.errors.LandLine}
                        value={customer.LandLine}
                        onChange={updateProperty}
                        autocomplete="home tel"
                      />
                    </div>
                  )}

                  {this.shouldShowFieldWithCustomer('MobilePhone') && (
                    <div className="form-group col-md-6">
                      <InputField
                        id="customer-mobile"
                        label={
                          t('Mobile Number') +
                          this.showStarIfRequired('SignupForm', 'MobilePhone')
                        }
                        name="MobilePhone"
                        errors={customerValidation.errors.MobilePhone}
                        value={customer.MobilePhone}
                        onChange={updateProperty}
                        autocomplete="mobile tel"
                      />
                    </div>
                  )}
                </div>
                <div className="row">
                  {this.shouldShowFieldWithCustomer('Gender') && (
                    <div className="col-md-6">
                      <div className="form-group">
                        <SelectField
                          id="customer-gender"
                          label={
                            t('Gender') +
                            this.showStarIfRequired('SignupForm', 'Gender')
                          }
                          name="Gender"
                          errors={customerValidation.errors.Gender}
                          value={customer.Gender}
                          onChange={updateProperty}
                          autocomplete="sex"
                        >
                          <option value="">-</option>
                          <option value="Male">{t('Male')}</option>
                          <option value="Female">{t('Female')}</option>
                          <option value="Other">{t('Non-binary')}</option>
                          <option value="RatherNotSay">
                            {t('Rather Not Say')}
                          </option>
                        </SelectField>
                      </div>
                    </div>
                  )}
                  {this.shouldShowFieldWithCustomer('DateOfBirth') && (
                    <div className="col-md-6">
                      <div className="form-group">
                        <DateInputField
                          id="customer-dob"
                          label={`${t('Date of birth')} (${moment
                            .localeData()
                            .longDateFormat('L')}) ${this.showStarIfRequired(
                            'SignupForm',
                            'DateOfBirth'
                          )}`}
                          name="DateOfBirth"
                          errors={customerValidation.errors.DateOfBirth}
                          value={customer.DateOfBirth}
                          onChange={updateProperty}
                          autocomplete="bday"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {this.shouldShowFieldWithCustomer('Email') && (
              <div className="form-group">
                <InputField
                  inputProps={{
                    disabled: !editableEmail ? 'disabled' : null,
                    readOnly: !editableEmail ? 'readonly' : null,
                  }}
                  id="customer-email"
                  label={t('Email') + '*'}
                  name="Email"
                  icon={'icon-email'}
                  errors={customerValidation.errors.Email}
                  value={customer.Email}
                  onChange={updateProperty}
                  autocomplete="email"
                />
                {!editableEmail && (
                  <small>{t('Contact us to change your email')}</small>
                )}
                {userAlreadyExists && (
                  <div>
                    <small className="text-red mb-16">
                      {t(
                        'This email is already taken. If you own this account, please sign in.'
                      )}
                    </small>
                    <Link href={routes.login}>
                      <a className="btn btn-sm">{t('Sign in with password')}</a>
                    </Link>{' '}
                    {t('or')}{' '}
                    <Link
                      href={`${routes.signup_restore}?token=${existingUserUniqueId}`}
                    >
                      <a className="btn btn-sm">
                        {t('Log in using email link')}
                      </a>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {saveCustomer && (
              <ActionButton
                action={() => saveCustomer()}
                busy={authStore.isSavingCustomerWithUser}
              />
            )}
          </fieldset>
        </div>
        {!userAlreadyExists && this.state.shouldShowContactForm && (
          <div className="card card-dashboard mb-32">
            <fieldset className="mw-640" id="personal-address">
              {!hideTitle && (
                <h5 className="section__title">{t('Personal Address')}</h5>
              )}

              <>
                {this.shouldShowFieldWithCustomer('Address') && (
                  <div className="row">
                    <div className="form-group col-12 ">
                      <TextAreaInputField
                        id="customer-address"
                        label={
                          t('Address') +
                          this.showStarIfRequired('Forms', 'Address')
                        }
                        name="Address"
                        errors={customerValidation.errors.Address}
                        value={customer.Address}
                        onChange={updateProperty}
                        autocomplete="street-address"
                      />
                    </div>
                  </div>
                )}

                <div className="row">
                  {this.shouldShowFieldWithCustomer('CityName') && (
                    <div className="form-group col-md-6 ">
                      <InputField
                        id="customer-cityName"
                        label={
                          t('City') +
                          this.showStarIfRequired('Forms', 'CityName')
                        }
                        name="CityName"
                        errors={customerValidation.errors.CityName}
                        value={customer.CityName}
                        onChange={updateProperty}
                        autocomplete="address-level2"
                      />
                    </div>
                  )}
                  {this.shouldShowFieldWithCustomer('PostCode') && (
                    <div className="form-group col-md-6">
                      <InputField
                        id="customer-zip"
                        label={
                          t('Zip / Postcode') +
                          this.showStarIfRequired('Forms', 'PostCode')
                        }
                        name="PostCode"
                        errors={customerValidation.errors.PostCode}
                        value={customer.PostCode}
                        onChange={updateProperty}
                        autocomplete="postal-code"
                      />
                    </div>
                  )}
                </div>

                <div className="row">
                  {this.shouldShowFieldWithCustomer('State') && (
                    <div className="form-group col-md-6">
                      <InputField
                        id="customer-state"
                        label={
                          t('County') +
                          this.showStarIfRequired('Forms', 'State')
                        }
                        name="State"
                        errors={customerValidation.errors.State}
                        value={customer.State}
                        onChange={updateProperty}
                        autocomplete="address-level1"
                      />
                    </div>
                  )}

                  {this.shouldShowFieldWithCustomer('Country') && (
                    <div className="form-group col-md-6">
                      <CountrySelectField
                        id="customer-country"
                        label={
                          t('Country') +
                          this.showStarIfRequired('Forms', 'Country')
                        }
                        name="CountryId"
                        errors={customerValidation.errors.CountryId}
                        value={customer.CountryId}
                        onChange={updateProperty}
                        autocomplete="country-name"
                      />
                    </div>
                  )}
                </div>

                <div className="row">
                  {this.shouldShowFieldWithCustomer('BillingName') && (
                    <div className="form-group col-md-6 ">
                      <InputField
                        id="customer-billingName"
                        label={
                          t('Company/Org. name') +
                          this.showStarIfRequired('Forms', 'BillingName')
                        }
                        name="BillingName"
                        errors={customerValidation.errors.BillingName}
                        value={customer.BillingName}
                        onChange={updateProperty}
                        autocomplete="organization"
                      />
                    </div>
                  )}
                  {this.shouldShowFieldWithCustomer('TaxIDNumber') && (
                    <div className="form-group col-md-6 ">
                      <InputField
                        id="customer-vat"
                        label={
                          t('VAT / Tax number') +
                          this.showStarIfRequired('Forms', 'TaxIDNumber')
                        }
                        name="TaxIDNumber"
                        errors={customerValidation.errors.TaxIDNumber}
                        value={customer.TaxIDNumber}
                        onChange={updateProperty}
                      />
                    </div>
                  )}
                </div>

                <div className="row">
                  {this.shouldShowFieldWithCustomer('ProfileWebsite') && (
                    <div className="form-group col-12 ">
                      <InputField
                        id="customer-companyWebsite"
                        label={
                          t('Company website') +
                          this.showStarIfRequired('Forms', 'ProfileWebiste')
                        }
                        name="ProfileWebsite"
                        errors={customerValidation.errors.ProfileWebsite}
                        value={customer.ProfileWebsite}
                        onChange={updateProperty}
                        autocomplete="url"
                      />
                    </div>
                  )}
                </div>
              </>

              {saveCustomer && (
                <ActionButton
                  action={() => saveCustomer()}
                  busy={authStore.isSavingCustomerWithUser}
                />
              )}
            </fieldset>
          </div>
        )}
      </>
    );
  }
}

export default asForm(AccountDetailsSection, 'customer');
