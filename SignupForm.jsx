import React, { useEffect, useState } from 'react';
import { routes } from 'env/routes';
import { Trans, useTranslation } from 'react-i18next';
import { withRouter } from 'next/router';
import { inject, observer } from 'mobx-react';
import { action } from 'mobx';
import withCustomComponent from 'ui/components/withCustomComponent';
import { SignupPageTermsAndConditions } from 'ui/_pages/signup/SignupPageTermsAndConditions';
import LoadingSpinner from 'ui/components/LoadingSpinner';

import AccountDetailsSection from 'ui/_pages/profile/AccountDetailsSection';
import AppearanceSection from 'ui/_pages/profile/AppearanceSection';
import BillingDetailsSection from 'ui/_pages/profile/BillingDetailsSection';
import CustomFieldsSection from 'ui/_pages/profile/CustomFieldsSection';
import ProfessionalProfileSection from 'ui/_pages/profile/ProfessionalProfileSection';

import { SignupPagePassword } from 'ui/_pages/signup/SignupPagePassword';
import RecaptchaSection from 'ui/_pages/signup/RecaptchaSection';

import HomeLocationSection from 'ui/_pages/signup/HomeLocationSection';
import { NewsletterSignUpCheckbox } from 'ui/_pages/signup/NewsletterSignUpCheckbox';

import qs from 'query-string';

export const SignupForm = withCustomComponent('SignupForm')(
  inject(
    'authStore',
    'appStore'
  )(
    withRouter(
      observer(({ componentName, router, appStore, authStore }) => {
        const { t } = useTranslation();
        const { configuration } = appStore;
        const {
          signupPage,
          customer,
          isLoggedIn,
          customFieldsGroups,
          signupCustomFieldsGroups,
          isSavingCustomerWithUser,
          userAlreadyExists,
        } = authStore;
        const groups = isLoggedIn
          ? customFieldsGroups
          : signupCustomFieldsGroups;
        const [recaptcha, setRecaptcha] = useState(null);
        const isNewCustomer = !customer.Id > 0;

        const query = qs.parse(location.search);
        const {
          tariff_guid,
          team_guid,
          returnurl,
          returnUrl,
          Returnurl,
          refererGuid,
          discountcode,
          discountCode,
          proposal_id,
          email,
          fullName,
        } = query;
        const signupToken = query.t;
        const return_url = returnurl ?? returnUrl ?? Returnurl;
        const quickForm =
          return_url != null && return_url.indexOf('proposal') == -1;
        const utm_source = router.query.utm_source;
        const utm_medium = router.query.utm_medium;
        const utm_campaign = router.query.utm_campaign;
        const utm_content = router.query.utm_content;
        const utm_term = router.query.utm_term;

        const saveForm = () => {
          // GeneralTermsAcceptedOnline should be either true or false
          if (customer.GeneralTermsAcceptedOnline === null) {
            action(() => (customer.GeneralTermsAcceptedOnline = false))();
          }

          authStore
            .saveCustomer({
              router: router,
              recaptcha: recaptcha,
              createUser: true,
              returnUrl: return_url,
              teamGuid: team_guid,
              tariffGuid: tariff_guid,
              refererGuid,
              discountCode: discountcode ?? discountCode,
              quickForm,
              signupToken,
              proposalId: proposal_id,
              utm_source,
              utm_medium,
              utm_campaign,
              utm_content,
              utm_term,
            })
            .then(async (result) => {
              if (return_url) {
                //do not use router.push here, it breaks
                //when using server-side redirects
                window.location = return_url.replace('?', '?public&');
                return result;
              } else {
                //Redirect to plan page

                if (tariff_guid)
                  router.push({
                    pathname: routes.signup_plan,
                    query: {
                      tariff_guid,
                    },
                  });
                else
                  router.push({
                    pathname: routes.signup_plan,
                  });
              }
            })
            .catch((err) => {
              if (err.data) {
                //Handle teams with default plans
                if (err.data == 'NewContract')
                  return router.push(routes.signup_products);
                if (err.data.RedirectTo) {
                  window.location = err.data.RedirectTo;
                  return;
                }
              }

              if (err.status == 413 || `${err}`.indexOf('too large') > -1) {
                err = t(
                  'The image you chose is larger than the 10mb file limit. Please choose a smaller image and try again.'
                );
              }

              appStore.setPopMessage(
                t('Sorry, we could not load this page') + '<br/><br/>' + err
              );
            });
        };

        useEffect(() => {
          action(() => {
            if (fullName) authStore.customer.FullName = fullName;
            if (email) authStore.customer.Email = email;
          })();
        }, []);

        return (
          <div data-component-name={componentName} className="mw-640">
            {signupPage.Team && (
              <div class="alert alert-info">
                <div>
                  <Trans>
                    <b>Heads Up! </b>
                    <span>You are joining the following team: </span>
                    <b>{{ teamName: signupPage.Team.Name }}</b>. If this is not
                    right, please do not complete this form and get in touch
                    with us
                  </Trans>
                </div>
              </div>
            )}

            <fieldset>
              <h5>{t('Personal details')}</h5>
              <HomeLocationSection customer={customer} />
              <AccountDetailsSection
                customer={customer}
                hideTitle={true}
                editableEmail={!customer.Id > 0}
              />
            </fieldset>

            {!userAlreadyExists && (
              <>
                {<AppearanceSection customer={customer} />}

                <BillingDetailsSection customer={customer} />

                {groups.length > 0 && (
                  <CustomFieldsSection customer={customer} />
                )}
                {(
                  <ProfessionalProfileSection customer={customer} />
                )}
                {isNewCustomer && configuration['Signup.AskForPassword'] && (
                  <div className="card card-dashboard mb-32">
                    <SignupPagePassword customer={customer} />
                  </div>
                )}
                {isNewCustomer && (
                  <>
                    <div className="mb-8">
                      <NewsletterSignUpCheckbox customer={customer} />
                    </div>
                    <SignupPageTermsAndConditions customer={customer} />
                  </>
                )}

                {isNewCustomer && configuration['Signup.UseCaptcha'] && (
                  <RecaptchaSection
                    customer={customer}
                    verifyCallback={(value) => {
                      setRecaptcha(value);
                    }}
                  />
                )}

                <a
                  onClick={(ev) => {
                    ev.preventDefault();
                    saveForm();
                  }}
                  disabled={isSavingCustomerWithUser ? 'disabled' : null}
                  className="btn px-64 mt-24"
                  href="#"
                >
                  {isSavingCustomerWithUser ? (
                    <LoadingSpinner />
                  ) : (
                    <>{t('Continue')}</>
                  )}
                </a>
              </>
            )}
          </div>
        );
      })
    )
  )
);
