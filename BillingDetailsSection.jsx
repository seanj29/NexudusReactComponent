import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import { observer, inject } from 'mobx-react';
import { withTranslation } from 'react-i18next';
import TextAreaInputField from 'ui/components/forms/TextAreaInputField';
import CountrySelectField from 'ui/components/forms/CountrySelectField';
import InputField from 'ui/components/forms/InputField';
import ActionButton from 'ui/components/forms/ActionButton';
import asForm from 'ui/components/forms/asForm';
import { shouldShowField } from 'ui/components/forms/formFieldHelpers';

@withTranslation()
@inject('appStore', 'authStore')
@observer
class BillingDetailsSection extends Component {
  static propTypes = {
    customer: PropTypes.object.isRequired,
  };

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
    const { t, authStore, customer, saveCustomer, updateProperty, appStore } =
      this.props;

    const shouldShowBillingForm =
      appStore.configuration['SignupForm.ShowBillingSection'] == 'true' &&
      (this.shouldShowFieldWithCustomer('BillingAddress') ||
        this.shouldShowFieldWithCustomer('BillingCountry') ||
        this.shouldShowFieldWithCustomer('BillingState') ||
        this.shouldShowFieldWithCustomer('BillingCityName') ||
        this.shouldShowFieldWithCustomer('BillingPostCode') ||
        this.shouldShowFieldWithCustomer('BillingEmail'));

    if (!shouldShowBillingForm) return null; 

    return (
      <div className={this.props.className ?? 'card card-dashboard mb-32'}>
        <fieldset
          data-component-name={this.props.componentName}
          id="billing-details"
        >
          <h5 className="section__title">{t('Billing/Company details')}</h5>

          {this.shouldShowFieldWithCustomer('BillingAddress') && (
            <div className="row">
              <div className="form-group col-sm-12 ">
                <TextAreaInputField
                  id="customer--billingaddress"
                  label={
                    t('Billing address') +
                    this.showStarIfRequired('Forms', 'BillingAddress')
                  }
                  name="BillingAddress"
                  errors={authStore.customerValidation.errors.BillingAddress}
                  value={customer.BillingAddress}
                  onChange={updateProperty}
                />
              </div>
            </div>
          )}

          <div className="row">
            {this.shouldShowFieldWithCustomer('BillingCityName') && (
              <div className="form-group col-md-6 ">
                <InputField
                  id="customer-billing-cityName"
                  label={
                    t('City') +
                    this.showStarIfRequired('Forms', 'BillingCityName')
                  }
                  name="BillingCityName"
                  errors={authStore.customerValidation.errors.BillingCityName}
                  value={customer.BillingCityName}
                  onChange={updateProperty}
                />
              </div>
            )}
            {this.shouldShowFieldWithCustomer('BillingPostCode') && (
              <div className="form-group col-md-6 ">
                <InputField
                  id="customer-billing-postcode"
                  label={
                    t('Zip / Postcode') +
                    this.showStarIfRequired('Forms', 'BillingPostCode')
                  }
                  name="BillingPostCode"
                  errors={authStore.customerValidation.errors.BillingPostCode}
                  value={customer.BillingPostCode}
                  onChange={updateProperty}
                />
              </div>
            )}
          </div>

          <div className="row">
            {this.shouldShowFieldWithCustomer('BillingState') && (
              <div className="form-group col-md-6 ">
                <InputField
                  id="customer-billing-cityName"
                  label={
                    t('County') +
                    this.showStarIfRequired('Forms', 'BillingState')
                  }
                  name="BillingState"
                  errors={authStore.customerValidation.errors.BillingState}
                  value={customer.BillingState}
                  onChange={updateProperty}
                />
              </div>
            )}

            <div className="form-group col-md-6 ">
              <CountrySelectField
                id="customer-billing-country"
                label={t('Billing country')}
                name="BillingCountryId"
                errors={authStore.customerValidation.errors.BillingCountryId}
                value={customer.BillingCountryId}
                onChange={updateProperty}
              />
            </div>
          </div>

          {this.shouldShowFieldWithCustomer('BillingEmail') && (
            <div className="row">
              <div className="form-group col-12 ">
                <InputField
                  id="customer-billing-email"
                  label={
                    t('Send my invoices to') +
                    this.showStarIfRequired('Forms', 'BillingEmail')
                  }
                  name="BillingEmail"
                  icon="icon-email"
                  errors={authStore.customerValidation.errors.BillingEmail}
                  value={customer.BillingEmail}
                  onChange={updateProperty}
                />
              </div>
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
    );
  }
}
export default asForm(BillingDetailsSection, 'customer');
