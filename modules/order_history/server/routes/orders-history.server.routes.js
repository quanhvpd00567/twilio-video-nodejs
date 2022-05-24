'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/orders-history.server.policy'),
  orderController = require('../controllers/orders-history.server.controller');

module.exports = function (app) {
  app.route('/api/orders/history').get(policy.isAllowed, orderController.history);
  app.route('/api/orders/history/:municId').get(policy.isAllowed, orderController.historyByMunic);
  app.route('/api/orders/history/:municId/count/:byMonth').get(policy.isAllowed, orderController.filterCountByMunic);
  app.route('/api/orders/history/:municId/price/:byMonth').get(policy.isAllowed, orderController.filterPriceByMunic);
};
