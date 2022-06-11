'use strict';

/**
 * Module dependencies
 */
var controller = require('../controllers/orders.mobile.controller'),
  policy = require('../policies/core.mobile.policy.js');

module.exports = function (app) {
  app.route('/api/mobile/orders/submit')
    .all(policy.tokenAllowed).post(controller.submitOrder);
  app.route('/api/mobile/orders/validate-products')
    .all(policy.tokenAllowed).post(controller.validateProductsToOrder);
};
