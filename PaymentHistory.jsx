/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect } from 'react';
import { withTranslation } from 'react-i18next';
import Link from 'next/link';
import { withRouter } from 'next/router';
import { inject, observer } from 'mobx-react';
import moment from 'moment';

import { routes } from 'env/routes';
import { KLARNA_SCRIPT } from 'env/consts';
import withScript from 'env/utils/withScript';
import { isServer } from 'env/ssr/ServerSideRenderManager';
// import { useSpreedlyCheck } from 'ui/hooks';
import { LocalizedPrice } from 'env/utils/NumbersLocalization';
import AuthenticatedLink from 'ui/components/AuthenticatedLink';
import XeroPaymentButton from 'ui/_pages/invoices/paymentButtons/XeroPaymentButton';
import ResponsiveTable from 'ui/components/tables/ResponsiveTable';
import withCustomComponent from 'ui/components/withCustomComponent';
import KlarnaPaymentButton from 'ui/_pages/invoices/paymentButtons/KlarnaPaymentButton';
import EpayPaymentButton from 'ui/_pages/invoices/paymentButtons/EpayPaymentButton';
import PayPalPaymentButton from 'ui/_pages/invoices/paymentButtons/PayPalPaymentButton';
import RazorPayPaymentButton from 'ui/_pages/invoices/paymentButtons/RazorPayPaymentButton';
import SpreedlyPaymentButton from 'ui/_pages/invoices/paymentButtons/SpreedlyPaymentButton';
import ForteAchPaymentButton from 'ui/_pages/invoices/paymentButtons/ForteAchPaymentButton';
import MidtransPaymentButton from 'ui/_pages/invoices/paymentButtons/MidtransPaymentButton';
import LiquidPayPaymentButton from 'ui/_pages/invoices/paymentButtons/LiquidPayPaymentButton';
import GoCardlessPaymentButton from 'ui/_pages/invoices/paymentButtons/GoCardlessPaymentButton';
import PeachPaymentsPaymentButton from 'ui/_pages/invoices/paymentButtons/PeachPaymentsPaymentButton';
import HostedPaymentProviderButton from 'ui/_pages/invoices/paymentButtons/HostedPaymentProviderButton';

const PaymentHistory = withCustomComponent('PaymentHistory')(
  withScript([KLARNA_SCRIPT])(
    inject(
      'appStore',
      'authStore',
      'invoicingStore'
    )(
      withTranslation()(
        withRouter(
          observer(
            ({
              t,
              appStore,
              authStore,
              invoicingStore,
              componentName,
              router,
              showPaidInvoices = true,
              showUnpaidInvoices = true,
            }) => {
              const { customer, hasLoadedCustomer } = authStore;
              const { business, configuration, corporateDashboard } = appStore;
              const {
                invoicesPage,
                paidInvoices,
                lastPaidInvoice,
                unpaidInvoices,
                hasLoadedInvoicesPage,
              } = invoicingStore;
              const {
                ForteECheckEnabled,
                EpayEnabled,
                MidtransEnabled,
                StripeACHEnabled,
                SpreedlyEnabled,
              } = invoicesPage;

              // const {
              //   checkTransactionStatusAfterRedirect,
              //   getSpreedlyLastTransactionInvoice,
              // } = useSpreedlyCheck(appStore, authStore);

              function isInvoiceBeingProcessed(invoice) {
                return (
                  (invoice.CustomData || invoice.GoCardlessReference) &&
                  (invoice.CustomData ?? '').indexOf('tok_') === -1 &&
                  (invoice.CustomData ?? '').indexOf('vt_') === -1
                );
              }

              // useEffect(() => {
              //   const lastTransactionInvoice =
              //     getSpreedlyLastTransactionInvoice(unpaidInvoices);

              //   checkTransactionStatusAfterRedirect(
              //     lastTransactionInvoice ?? lastPaidInvoice
              //   );
              // }, [lastPaidInvoice]);

              useEffect(() => {
                if (configuration['ePay.Enabled'] && EpayEnabled) {
                  $('.epay').on('click', payWithEPay);

                  function payWithEPay() {
                    const invoiceNumber = $(this).attr('data-description');
                    const url = $(this).attr('data-payurl');
                    const currency = $(this).attr('data-currency');
                    const amount = $(this).attr('data-amount');
                    const hash = $(this).attr('data-hash');
                    const email = $(this).attr('data-email');
                    const merchantId = $(this).attr('data-merchant-id');

                    const paymentWindow = new PaymentWindow({
                      merchantnumber: merchantId,
                      amount,
                      currency,
                      orderid: invoiceNumber,
                      instantcapture: 1,
                      subscription: 1,
                      instantcallback: 1,
                      callbackurl: url,
                      subscriptionname: email,
                      accepturl: `${appStore.business.HomeUrl}/profile/invoices?payment_result=ok`,
                      cancelurl: `${appStore.business.HomeUrl}/profile/invoices?payment_result=fail`,
                      hash,
                    });
                    paymentWindow.open();
                  }

                  if (!isServer()) {
                    const script = document.createElement('script');

                    script.src =
                      'https://ssl.ditonlinebetalingssystem.dk/integration/ewindow/paymentwindow.js';
                    document.body.appendChild(script);
                  }
                }

                if (configuration['RazorPay.Enabled']) {
                  $('.razorpay').on('click', function (e) {
                    const invoiceNumber = $(this).attr('data-description');
                    const url = $(this).attr('data-payUrl');
                    const amount = $(this).attr('data-amount');
                    const options = {
                      key: configuration['RazorPay.KeyId'],
                      amount,
                      name: appStore.business.Name,
                      description: invoiceNumber,
                      image: `${appStore.business.NativeHomeUrlWithLanguage}/business/getLogo?w=600&h=600&mode=Pad`,
                      handler: function (response) {
                        window.location =
                          url +
                          '&razorpay_payment_id=' +
                          response.razorpay_payment_id;
                      },
                      prefill: {
                        contact: authStore.customer.MobilePhone,
                        name: authStore.customer.FullNameForInvoice,
                        email: authStore.customer.EmailForInvoice,
                      },
                      theme: {
                        color: '#7b7b7b',
                      },
                    };
                    const rzp1 = new Razorpay(options);

                    rzp1.open();
                    e.preventDefault();
                  });

                  if (!isServer()) {
                    const script = document.createElement('script');

                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';

                    document.body.appendChild(script);
                  }
                }

                if (
                  configuration['Forte.eCheckPayments'] &&
                  ForteECheckEnabled
                ) {
                  const forteCallback = (e) => {
                    const response = JSON.parse(e.data);

                    switch (response.event) {
                      case 'begin':
                        const message = t(
                          'By setting up the following eCheck/ACH agreement, you authorize "{{Name}}" to automatically debit your bank account for any due invoices and, if necessary, credit your account to correct any erroneous debits. You will be asked for your bank account details after you agree with this. Do you want to continue?',
                          { Name: t(business.Name) }
                        );

                        $('.fco2-iframe-container').hide();

                        appStore.setYesNotQuestion(message).then((yes) => {
                          if (yes) $('.fco2-iframe-container').show();
                          else $('.fco2-iframe-container').remove();
                        });

                        break;
                      case 'success':
                        const agent = appStore.getAgent();

                        agent.requests
                          .post(`/invoices/ForteResult`, response)
                          .then(() => {
                            appStore.setPopMessage(
                              t(
                                "Thank you, we'll process your payment shortly."
                              )
                            );
                            setTimeout(function () {
                              window.location.reload(1);
                            }, 5000);
                          })
                          .catch((xhr) => {
                            appStore.setPopMessage(
                              t(
                                'Sorry, transaction failed. failed reason is {{responseText}}',
                                { responseText: xhr.responseText }
                              )
                            );
                          });

                        break;
                      case 'failure':
                        appStore.setPopMessage(
                          t(
                            'Sorry, transaction failed. failed reason is {{response_description}}',
                            {
                              response_description:
                                response.response_description,
                            }
                          )
                        );
                    }
                  };

                  if (!isServer()) {
                    const script = document.createElement('script');

                    script.src = 'https://checkout.forte.net/v1/js';

                    document.body.appendChild(script);

                    window.forteCallback =
                      window.forteCallback ?? forteCallback;
                  }
                }

                if (configuration['Midtrans.Enabled'] && MidtransEnabled) {
                  //Midtrans scripts
                  const midtransScripts = document.createElement('script');

                  midtransScripts.src = 'https://app.midtrans.com/snap/snap.js';
                  midtransScripts['data-client-key'] =
                    appStore.configuration['Midtrans.ClientKey'];

                  document.body.appendChild(midtransScripts);
                }

                if (router.query.gc_result === 'ok') {
                  //Send to complete if in sign-up flow
                  if (router.pathname === routes.signup_payment) {
                    router.push(routes.signup_complete);
                  } else {
                    router.push(routes.invoices);
                  }

                  appStore.setPopMessage(
                    t(
                      'Thank you, your direct debit agreement has been set correctly.'
                    )
                  );
                }

                if (router.query.gc_result === 'fail') {
                  if (router.pathname !== routes.signup_payment) {
                    router.push(routes.invoices);
                  }

                  appStore.setPopMessage(
                    t('Sorry, your direct debit agreement could not be set.')
                  );
                }

                if (router.query.payment_result === 'fail') {
                  //Send to invoices list if not in sign-up flow
                  if (router.pathname != routes.signup_payment) {
                    router.push(routes.invoices);
                  }

                  appStore.setPopMessage(
                    t('Sorry, we could not process your payment')
                  );
                }

                if (router.query.payment_result === 'awaiting') {
                  //Send to complete if in sign-up flow
                  if (router.pathname == routes.signup_payment) {
                    router.push(routes.signup_complete);
                  } else {
                    router.push(routes.invoices);
                  }

                  appStore.setPopMessage(
                    t('Thank you. We will check your payment shortly.')
                  );
                }

                if (router.query.payment_result === 'ok') {
                  //Send to complete if in sign-up flow
                  if (router.pathname == routes.signup_payment) {
                    router.push(routes.signup_complete);
                  } else {
                    router.push(routes.invoices);
                  }

                  appStore.setPopMessage(
                    t('Thank you. We have received your payment.')
                  );
                }
              }, []);

              if (!hasLoadedCustomer || !hasLoadedInvoicesPage)
                return <div></div>;

              return (
                <div className="card card-dashboard mb-32">
                  <fieldset
                    className="section--settings"
                    id="payment-history"
                    data-component-name={componentName}
                  >
                    <h5 className="section__title">
                      {t(
                        `${
                          !corporateDashboard
                            ? 'Invoices and payments'
                            : 'Orders'
                        }`
                      )}
                    </h5>

                    {customer.HasAcceptedStripeACHAgreement &&
                      customer.HasVerifiedStripeACHDeposits &&
                      StripeACHEnabled && (
                        <div className="alert alert-success mb-32">
                          <strong>
                            {t(
                              'Your bank account has been verified and is set up for payments. We will use these details to process any due invoices.'
                            )}
                          </strong>
                        </div>
                      )}

                    {invoicesPage?.Invoices.length === 0 && (
                      <div className="alert alert-outline">
                        <i className="icon-invoice"></i>
                        <h5>{t('You have no invoices or payments.')}</h5>
                        <p>
                          {t(
                            'You can make a booking, book an event, or buy a product. These are some links you may find useful:'
                          )}
                        </p>
                        <div className="btn-group">
                          <Link href={routes.resources}>
                            <a className="btn btn-outline-gray btn-icon">
                              <i className="icon-bookings"></i>
                              {t('Make a Booking')}
                            </a>
                          </Link>
                          <Link href={routes.events}>
                            <a className="btn btn-outline-gray btn-icon">
                              <i className="icon-calendar-view"></i>
                              {t('Book an event')}
                            </a>
                          </Link>
                          <Link href={routes.store}>
                            <a
                              className="btn btn-outline-gray btn-icon"
                              aria-label={t('Cart')}
                            >
                              <i className="icon-cart"></i>
                              {t('Buy a product')}
                            </a>
                          </Link>
                        </div>
                      </div>
                    )}

                    {invoicesPage.Invoices.length > 0 && (
                      <ResponsiveTable>
                        <thead>
                          <tr>
                            <th>{t('Date')}</th>
                            {!corporateDashboard && <th>{t('Amount')}</th>}
                            {!corporateDashboard && (
                              <th className="text-left text-md-right">
                                {t('Due')}
                              </th>
                            )}
                            {!corporateDashboard && <th>{t('Status')}</th>}
                            {!corporateDashboard && <th></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {showUnpaidInvoices &&
                            unpaidInvoices.map((invoice, i) => {
                              const isInvoiceProcessed =
                                isInvoiceBeingProcessed(invoice);

                              return (
                                <>
                                  <tr key={i}>
                                    <td>
                                      <div>
                                        {'#'}
                                        {corporateDashboard
                                          ? invoice.InvoiceNumber.replace(
                                              'INV-',
                                              ''
                                            )
                                          : invoice.InvoiceNumber}
                                        {' - '}
                                        {moment(
                                          invoice.CreatedOnUtc + 'Z'
                                        ).format('L')}
                                      </div>
                                      {corporateDashboard && (
                                        <small
                                          dangerouslySetInnerHTML={{
                                            __html: invoice.Description,
                                          }}
                                        ></small>
                                      )}
                                      {!corporateDashboard &&
                                        invoice.CustomData == null && (
                                          <small className="mt-0">
                                            {customer.HasGoCardlessContractNumber &&
                                            customer.EnableGoCardlessPayments
                                              ? t(
                                                  'To be paid by Direct Debit by {{DueDate, L}}',
                                                  {
                                                    DueDate: new Date(
                                                      invoice.DueDate
                                                    ),
                                                  }
                                                )
                                              : customer.RegularPaymentProvider ===
                                                'StripeACH'
                                              ? t(
                                                  'To be paid by Stripe ACH by {{DueDate, L}}',
                                                  {
                                                    DueDate: new Date(
                                                      invoice.DueDate
                                                    ),
                                                  }
                                                )
                                              : customer.RegularPaymentProvider ===
                                                  'MultiGateway' &&
                                                customer.CardNumber
                                              ? t(
                                                  'To be paid using card ending in {{CardNumber}} on {{DueDate, L}}',
                                                  {
                                                    CardNumber:
                                                      customer.CardNumber,
                                                    DueDate: new Date(
                                                      invoice.DueDate
                                                    ),
                                                  }
                                                )
                                              : t(
                                                  'To be paid by {{DueDate, L}}',
                                                  {
                                                    DueDate: new Date(
                                                      invoice.DueDate
                                                    ),
                                                  }
                                                )}
                                          </small>
                                        )}
                                      {configuration[
                                        'Members.PrintInvoices'
                                      ] && (
                                      <div className="d-inline-flex">
                                        <AuthenticatedLink
                                          className="d-inline-flex align-items-center mt-16 fs-12 tdn"
                                          href={`${business.NativeHomeUrlWithLanguage}/invoices/print?guid=${invoice.UniqueId}`}
                                        >
                                          <i className="icon-download fs-14 mr-4 tdn"></i>
                                          <span className="tdhu">
                                            {t('Download PDF')}
                                          </span>
                                        </AuthenticatedLink>
                                        <AuthenticatedLink
                                          className="d-inline-flex align-items-center mt-16 ml-4 fs-12 tdn"
                                          href={`${business.NativeHomeUrlWithLanguage}/invoices/csvbytoken?guid=${invoice.UniqueId}&cguid=${customer.UniqueId}`}
                                        >
                                          <i className="icon-download fs-14 mr-4 tdn"></i>
                                          <span className="tdhu">
                                            {t('Download CSV')}
                                          </span>
                                        </AuthenticatedLink>
                                    </div>
                                      )}
                                      {configuration[
                                        'PeachPayments.Enabled'
                                      ] && (
                                        <PeachPaymentsPaymentButton
                                          invoice={invoice}
                                        />
                                      )}
                                    </td>
                                    {!corporateDashboard && (
                                      <>
                                        <td>
                                          <LocalizedPrice
                                            amount={invoice.TotalAmount}
                                            currency={invoice.Currency.Code}
                                          />
                                        </td>

                                        <td className="text-left text-md-right">
                                          {invoice.DueAmount <= 0 && (
                                            <span className="text-green">
                                              <LocalizedPrice
                                                amount={invoice.DueAmount}
                                                currency={invoice.Currency.Code}
                                              />
                                            </span>
                                          )}
                                          {invoice.DueAmount > 0 && (
                                            <span className="text-red">
                                              <LocalizedPrice
                                                amount={invoice.DueAmount}
                                                currency={invoice.Currency.Code}
                                              />
                                            </span>
                                          )}
                                        </td>

                                        {!isInvoiceProcessed && (
                                          <>
                                            <td>
                                              {moment(invoice.DueDate) >
                                                moment() && (
                                                <div className="d-inline-flex tag with-icon-left bg-red-200">
                                                  <i className="icon-alert"></i>
                                                  {t('Unpaid')}
                                                </div>
                                              )}
                                              {moment(invoice.DueDate) <=
                                                moment() && (
                                                <div className="d-inline-flex tag with-icon-left bg-red-200">
                                                  <i className="icon-alert"></i>
                                                  {t('Due')}
                                                </div>
                                              )}
                                            </td>
                                            <td>
                                              <div className="table--settings__payment-options">
                                                {customer.EnableGoCardlessPayments &&
                                                  !customer.HasGoCardlessContractNumber && (
                                                    <GoCardlessPaymentButton
                                                      returnUrl={
                                                        window.location
                                                          .pathname +
                                                        '?gc_result=ok'
                                                      }
                                                      failedReturnUrl={
                                                        window.location
                                                          .pathname +
                                                        '?gc_result=fail'
                                                      }
                                                      invoice={invoice}
                                                    />
                                                  )}

                                                {SpreedlyEnabled &&
                                                  (customer.EnableGoCardlessPayments ||
                                                    unpaidInvoices.length >
                                                      1) &&
                                                  configuration[
                                                    'Spreedly.Enabled'
                                                  ] == 'True' && (
                                                    <SpreedlyPaymentButton
                                                      invoice={invoice}
                                                    />
                                                  )}

                                                {configuration[
                                                  'Forte.eCheckPayments'
                                                ] && (
                                                  <ForteAchPaymentButton
                                                    invoice={invoice}
                                                  />
                                                )}

                                                {configuration[
                                                  'Midtrans.Enabled'
                                                ] && (
                                                  <MidtransPaymentButton
                                                    invoice={invoice}
                                                  />
                                                )}

                                                {configuration[
                                                  'Paypal.Enabled'
                                                ] && (
                                                  <PayPalPaymentButton
                                                    invoice={invoice}
                                                  />
                                                )}

                                                {configuration[
                                                  'RazorPay.Enabled'
                                                ] && (
                                                  <RazorPayPaymentButton
                                                    invoice={invoice}
                                                  />
                                                )}

                                                {configuration[
                                                  'ePay.Enabled'
                                                ] && (
                                                  <EpayPaymentButton
                                                    invoice={invoice}
                                                  />
                                                )}

                                                {configuration[
                                                  'LiqdPay.Enabled'
                                                ] && (
                                                  <LiquidPayPaymentButton
                                                    invoice={invoice}
                                                  />
                                                )}
                                                {configuration[
                                                  'Xero.PaymentLinks'
                                                ] && (
                                                  <XeroPaymentButton
                                                    invoice={invoice}
                                                  />
                                                )}
                                                {[...Array(2).keys()].map(
                                                  (i) =>
                                                    configuration[
                                                      `HostedPayments.Provider${
                                                        i + 1
                                                      }.Enabled`
                                                    ] && (
                                                      <HostedPaymentProviderButton
                                                        key={i}
                                                        index={i}
                                                        providerIndex={i + 1}
                                                        invoice={invoice}
                                                      />
                                                    )
                                                )}
                                              </div>
                                            </td>
                                          </>
                                        )}
                                        {isInvoiceBeingProcessed(invoice) && (
                                          <td colSpan="2">
                                            <div className="d-flex align-items-center">
                                              <i className="icon-pending mr-8 fs-24"></i>
                                              <span className="">
                                                {t(
                                                  'Processing your payment...'
                                                )}
                                              </span>
                                            </div>
                                          </td>
                                        )}
                                      </>
                                    )}
                                  </tr>
                                  {configuration['Klarna.Enabled'] && (
                                    <KlarnaPaymentButton invoice={invoice} />
                                  )}
                                </>
                              );
                            })}

                          {SpreedlyEnabled &&
                            showUnpaidInvoices &&
                            !customer.EnableGoCardlessPayments &&
                            unpaidInvoices.length == 1 &&
                            !isInvoiceBeingProcessed(unpaidInvoices[0]) && (
                              <SpreedlyPaymentButton
                                className="btn btn-sm mt-20 mb-20"
                                label={t('Pay by card to complete purchase')}
                                invoice={unpaidInvoices[0]}
                              />
                            )}
                          {showPaidInvoices &&
                            paidInvoices.map((invoice, i) => (
                              <tr key={i}>
                                <td>
                                  <div>
                                    {'#'}
                                    {invoice.InvoiceNumber}
                                    {' - '}
                                    {moment(invoice.CreatedOnUtc + 'Z').format(
                                      'L'
                                    )}
                                  </div>

                                  {configuration['Members.PrintInvoices'] && (
                                    <div className="d-inline-flex">
                                      <AuthenticatedLink
                                        className="d-inline-flex align-items-center mt-16 fs-12 tdn"
                                        href={`${business.NativeHomeUrlWithLanguage}/invoices/print?guid=${invoice.UniqueId}`}
                                      >
                                        <i className="icon-download fs-14 mr-4 tdn"></i>
                                        <span className="tdhu">
                                          {t('Download PDF')}
                                        </span>
                                      </AuthenticatedLink>
                                      <AuthenticatedLink
                                        className="d-inline-flex align-items-center mt-16 ml-4 fs-12 tdn"
                                        href={`${business.NativeHomeUrlWithLanguage}/invoices/csvbytoken?guid=${invoice.UniqueId}&cguid=${customer.UniqueId}`}
                                      >
                                        <i className="icon-download fs-14 mr-4 tdn"></i>
                                        <span className="tdhu">
                                          {t('Download CSV')}
                                        </span>
                                      </AuthenticatedLink>
                                    </div>
                                  )}
                                </td>
                                {!corporateDashboard && (
                                  <>
                                    <td>
                                      <LocalizedPrice
                                        amount={invoice.TotalAmount}
                                        currency={invoice.Currency.Code}
                                      />
                                    </td>
                                    <td className="text-left text-md-right">
                                      {invoice.DueAmount <= 0 && (
                                        <span className="text-green">
                                          <LocalizedPrice
                                            amount={invoice.DueAmount}
                                            currency={invoice.Currency.Code}
                                          />
                                        </span>
                                      )}
                                      {invoice.DueAmount > 0 && (
                                        <span className="text-red">
                                          <LocalizedPrice
                                            amount={invoice.DueAmount}
                                            currency={invoice.Currency.Code}
                                          />
                                        </span>
                                      )}
                                    </td>
                                    <td colSpan="2">
                                      {invoice.CreditNote && (
                                        <div className="d-inline-flex tag with-icon-left">
                                          <i className="icon-invoice"></i>
                                          <span>{t('Credit Note')}</span>
                                        </div>
                                      )}
                                      {!invoice.CreditNote &&
                                        invoice.PaidOn && (
                                          <div className="d-flex align-items-center">
                                            <div className="d-inline-flex tag with-icon-left bg-green-200">
                                              <i className="icon-check"></i>
                                              {t('Paid on {{PaidOn, L}}', {
                                                PaidOn: new Date(
                                                  invoice.PaidOn
                                                ),
                                              })}
                                            </div>
                                          </div>
                                        )}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                        </tbody>
                        {customer.CurrentBalance > 0 && (
                          <tfoot>
                            <tr>
                              <td colSpan="5"></td>
                            </tr>
                            <tr>
                              <td colSpan="3">
                                {t('You account has a current balance of:')}
                              </td>
                              <td colSpan="2">
                                <strong>{customer.CurrentBalance}</strong>
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </ResponsiveTable>
                    )}
                  </fieldset>
                </div>
              );
            }
          )
        )
      )
    )
  )
);

export default PaymentHistory;
