'use strict';

/**
 * Module dependencies
 */
var controller = require('../controllers/master-addresses.mobile.controller'),
  policy = require('../policies/core.mobile.policy.js');

module.exports = function (app) {
  app.route('/api/mobile/master-addresses/get-by-postcode')
    .all(policy.tokenAllowed).post(controller.findOneByZipCode);
};
