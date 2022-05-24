'use strict';

/**
 * Module dependencies
 */
var creditsPolicy = require('../policies/credits.server.policy'),
  credits = require('../controllers/credits.server.controller');

module.exports = function (app) {
  // クレジットカードAPI
  app.route('/api/credits/add').post(creditsPolicy.isAllowed, credits.credit_add);
  app.route('/api/credits/update').post(creditsPolicy.isAllowed, credits.credit_update);
  app.route('/api/credits/delete').post(creditsPolicy.isAllowed, credits.credit_delete);
  app.route('/api/credits/pay').post(creditsPolicy.isAllowed, credits.credit_pay);
  app.route('/api/credits/invoice').post(creditsPolicy.isAllowed, credits.credit_invoice);
  app.route('/api/credits/info').post(creditsPolicy.isAllowed, credits.credit_info);
  app.route('/api/credits/token').post(creditsPolicy.isAllowed, credits.credit_token);
};
