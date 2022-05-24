'use strict';

/**
 * Module dependencies
 */
var pointHistoriesPolicy = require('../policies/point-histories.server.policy'),
  pointHistories = require('../controllers/point-histories.server.controller');

module.exports = function (app) {
  app.route('/api/point-histories/current').post(pointHistoriesPolicy.isAllowed, pointHistories.getCurrentPoints);
  app.route('/api/point-histories/used').get(pointHistoriesPolicy.isAllowed, pointHistories.getUsedPoints);
  app.route('/api/point-histories/expired').get(pointHistoriesPolicy.isAllowed, pointHistories.getExpiredPoints);
  app.route('/api/point-histories/:paymentHistoryId/update-payment-status').post(pointHistoriesPolicy.isAllowed, pointHistories.updatePaymentStatus);
};
