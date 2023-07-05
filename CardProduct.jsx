import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { action } from 'mobx';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { LocalizedPrice } from 'env/utils/NumbersLocalization';
import withCustomComponent from 'ui/components/withCustomComponent';
import { withRouter } from 'next/router';
import { routes } from 'env/routes';

@withCustomComponent('CardProduct')
@withTranslation()
@inject('appStore', 'checkoutStore')
@withRouter
@observer
class CardProduct extends Component {
  static propTypes = {
    product: PropTypes.object.isRequired,
  };

  render() {
    const {
      router,
      t,
      componentName,
      appStore,
      checkoutStore,
      product,
      displayOnly,
      addToCart,
    } = this.props;
    const { business } = appStore;

    const updateProduct = action((name, value) => {
      product[name] = value;
    });

    const addToBasket = async (product) => {
      const productToAdd = {
        ...product,
        Quantity: product.Quantity + 1,
        RegularCharge: product.AlwaysRecurrent
          ? true
          : product.AlwaysOneOff
          ? false
          : product.RegularCharge,
      };

      await checkoutStore.addToBasket({
        type: 'product',
        data: productToAdd,
        previewInvoice: false,
      });

      router.push(routes.checkout);
    };

    const isCorporateDashboard = appStore.corporateDashboard;
    const outOfStock = product?.CurrentStock < 1 && !product.AllowNegativeStock ;

    return (
      <div data-component-name={componentName} className={`card card-product`}>
        {
          outOfStock && (
            <div className="card-product__status">
              <span className="tag unavailable">{t('Sold out')}</span>
            </div>
          )
        }
        <div
          className="card-product__image"
          style={{
            backgroundImage: `url('${appStore.business.NativeHomeUrlWithLanguage}/products/getImage?id=${product.Id}&w=700&h=400&cache=${product.UpdatedOn}')`,
          }}
          blank-style={{ backgroundImage: `url('/img/blank.jpg')` }}
        ></div>
        <div className="card-product__content">
          <div className="card-product__content__header">
            <h5 className="mb-8">{product.Name}</h5>
            <p className="mb-24 fs-14 lh-14 text-gray-700">
              {product.Description}
            </p>
          </div>
          <div className="card-product__content__footer">
            {displayOnly ? (
              <></>
            ) : (
              <>
                {addToCart ? (
                  <></>
                ) : (
                  <div className="list-inline-8 flex-nowrap">
                    <select
                      disabled={outOfStock}
                      onChange={(ev) => {
                        updateProduct(
                          'RegularCharge',
                          ev.target.value == 'true' ? true : false
                        );
                      }}
                      value={product.RegularCharge == true ? 'true' : 'false'}
                      className="form-control w-70"
                    >
                      {!product.AlwaysRecurrent && (
                        <option value="false">
                          {t(
                            `One-off ${
                              isCorporateDashboard ? 'Purchase' : 'Payment'
                            }`
                          )}
                        </option>
                      )}
                      {!product.AlwaysOneOff && (
                        <option value="true">{t('Add to my plan')}</option>
                      )}
                    </select>
                    <select
                      disabled={outOfStock}
                      onChange={(ev) => {
                        if (product.AlwaysRecurrent)
                          updateProduct('RegularCharge', true);
                        if (product.AlwaysOneOff)
                          updateProduct('RegularCharge', false);
                        updateProduct('Quantity', ev.target.value);
                      }}
                      value={product.Quantity}
                      className="form-control w-30"
                    >
                      {[...Array(51).keys()].map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
            <div
              className={`mt-16 ${
                addToCart
                  ? 'd-flex align-items-center justify-content-between'
                  : ''
              }`}
            >
              {displayOnly ? (
                <></>
              ) : (
                <>
                  {addToCart && (
                    <button
                      className="btn btn-single-icon btn-white"
                      onClick={(ev) => {
                        ev.preventDefault();
                        addToBasket(product);
                      }}
                    >
                      <i className="icon-cart"></i>
                    </button>
                  )}
                </>
              )}
              <div className="float-right pl-24 fs-18 fw-500">
                {!isCorporateDashboard && (
                  <LocalizedPrice
                    amount={product.Price}
                    currency={product.Currency.Code}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CardProduct;
