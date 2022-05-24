'use strict';

/**
 * Module dependencies
 */
var ecommercesPolicy = require('../policies/ecommerces.server.policy'),
  ecommerces = require('../controllers/ecommerces.server.controller');

module.exports = function (app) {
  app.route('/api/address/:zipcode').get(ecommerces.getAddrees);
  app.route('/api/ecommerces/munic/:municId').get(ecommerces.getMunicInfo);
  app.route('/api/ecommerces/cart/:municId').get(ecommercesPolicy.isAllowed, ecommerces.getCart);
  app.route('/api/ecommerces/cart/add-or-update').post(ecommercesPolicy.isAllowed, ecommerces.addOrUpdateCart);
  app.route('/api/ecommerces/carts/pending').get(ecommercesPolicy.isAllowed, ecommerces.getCartsPending);
  app.route('/api/ecommerces/cart/remove-product').post(ecommercesPolicy.isAllowed, ecommerces.removeProductFromCart);
  app.route('/api/ecommerces/cart/:cartId').put(ecommercesPolicy.isAllowed, ecommerces.saveCartInfo);

  app.route('/api/ecommerces/orders/paging').post(ecommercesPolicy.isAllowed, ecommerces.pagingOrders);
  app.route('/api/ecommerces/orders/:orderECId').get(ecommercesPolicy.isAllowed, ecommerces.getOrderById);
  app.route('/api/ecommerces/order').post(ecommercesPolicy.isAllowed, ecommerces.submitOrder);
  app.route('/api/ecommerces/check-mapping-munic/:municId').get(ecommercesPolicy.isAllowed, ecommerces.checkMappingMunic);
  app.route('/api/ecommerces/remove-card').post(ecommercesPolicy.isAllowed, ecommerces.removeCard);

  app.route('/api/ecommerces/notices/3-latest').get(ecommercesPolicy.isAllowed, ecommerces.get3LatestNotices);
  app.route('/api/ecommerces/notices/paging').post(ecommercesPolicy.isAllowed, ecommerces.pagingNotices);
  app.route('/api/ecommerces/notices/:noticeId').get(ecommercesPolicy.isAllowed, ecommerces.getNoticeById);

  app.route('/api/ecommerces/municipalities-has-active-points').get(ecommercesPolicy.isAllowed, ecommerces.getMunicipalitiesHasActivePoints);

  app.route('/api/ecommerces/products/paging').post(ecommercesPolicy.isAllowed, ecommerces.pagingProducts);
  app.route('/api/ecommerces/products/:productECId').get(ecommercesPolicy.isAllowed, ecommerces.getProductById);
  app.route('/api/munic/:municId/using').get(ecommercesPolicy.isAllowed, ecommerces.getUsing);
  app.route('/api/ecommerces/:municId/using/:usingId').get(ecommercesPolicy.isAllowed, ecommerces.getUsingById);
  app.route('/api/ecommerces/card/:cardId').get(ecommercesPolicy.isAllowed, ecommerces.getCardById);
  app.route('/api/ecommerces/cards').post(ecommercesPolicy.isAllowed, ecommerces.addCard);
  app.route('/api/ecommerces/order-lastest').get(ecommercesPolicy.isAllowed, ecommerces.lastestOrder);


  // // Finish by binding the ecommerce middleware
  // app.param('ecommerceId', ecommerces.ecommerceById);
};
