import React from 'react';
import { routes } from 'env/routes';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'next/router';
import { inject, observer } from 'mobx-react';
import withCustomComponent from 'ui/components/withCustomComponent';
import { LocalizedPrice } from 'env/utils/NumbersLocalization';
import LoadingLayout from 'ui/layouts/LoadingLayout';
import Link from 'next/link';

export const ProductsTotal = withCustomComponent('ProductsTotal')(
  inject(
    'invoicingStore',
    'appStore',
    'checkoutStore'
  )(
    withRouter(
      observer(
        ({
          componentName,
          router,
          appStore,
          checkoutStore,
          invoicingStore,
          continueUrl,
          canContinueIfNoSelection,
        }) => {
          const { t } = useTranslation();
          const {
            storeProducts,
            selectedProducts,
            isLoadingStoreProducts,
          } = invoicingStore;
          const { business } = appStore;

          const totalOneOff = _.sumBy(storeProducts.products, (p) =>
            !p.RegularCharge ? p.Quantity * p.Price : 0
          );

          const totalRecurrent = _.sumBy(storeProducts.products, (p) =>
            p.RegularCharge ? p.Quantity * p.Price : 0
          );

          const addToBasket = async () => {
            for (
              let index = 0;
              index < storeProducts.products.length;
              index++
            ) {
              const p = storeProducts.products[index];
              if (p.Quantity > 0) {
                await checkoutStore.addToBasket({
                  type: 'product',
                  data: p,
                  previewInvoice: false,
                });
              }
            }

            router.push(continueUrl ?? routes.signup_summary);
          };

          if (isLoadingStoreProducts) return <LoadingLayout />;

          const hasSelectedProducts = selectedProducts.products.length > 0;

          const isCorporateDashboard = appStore.corporateDashboard;

          return (
            <div
              data-component-name={componentName}
              className={`product-totals ${hasSelectedProducts ? 'fixed' : ''}`}
            >
              {!isCorporateDashboard && (
                <>
                  {totalOneOff > 0 && (
                    <div className="d-flex align-items-start justify-content-between mb-8">
                      <h6 className="mb-0 mr-16">{t('One-off payment')}</h6>
                      <h5 className="mb-0">
                        <LocalizedPrice
                          amount={totalOneOff}
                          currency={business.Currency.Code}
                        />
                      </h5>
                    </div>
                  )}
                  {totalRecurrent > 0 && (
                    <div className="d-flex align-items-start justify-content-between mb-8">
                      <h6 className="mb-0 mr-16">{t('Add to my plan')}</h6>
                      <h5 className="mb-0">
                        <LocalizedPrice
                          amount={totalRecurrent}
                          currency={business.Currency.Code}
                        />
                      </h5>
                    </div>
                  )}
                  {hasSelectedProducts && (
                    <div className="d-flex align-items-start justify-content-between mb-8">
                      <h6 className="mb-0 mr-16">{t('Total to pay:')}</h6>
                      <h3 className="mb-0">
                        <LocalizedPrice
                          amount={totalOneOff + totalRecurrent}
                          currency={business.Currency.Code}
                        />
                      </h3>
                    </div>
                  )}
                </>
              )}
              <div className="d-flex align-items-center justify-content-between justify-content-md-end mt-16 pb-16">
                <a
                  href="#"
                  onClick={() => router.back()}
                  className="btn btn-outline px-24 px-md-32"
                >
                  {t('Cancel')}
                </a>
                {!hasSelectedProducts && canContinueIfNoSelection && (
                  <Link href={continueUrl}>
                    <a className="btn ml-16 px-32 px-md-72 w-sm-100">
                      {t('Continue')}
                    </a>
                  </Link>
                )}
                {hasSelectedProducts && (
                  <a
                    href="#"
                    className="btn ml-16 px-32 px-md-72 w-sm-100"
                    onClick={(ev) => {
                      ev.preventDefault();
                      addToBasket();
                    }}
                  >
                    {t('Add to basket')}
                  </a>
                )}
              </div>
            </div>
          );
        }
      )
    )
  )
);
