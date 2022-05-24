'use strict';

/**
 * Module dependencies
 */
var controller = require('../controllers/companies.mobile.controller'),
  policy = require('../policies/core.mobile.policy.js');

module.exports = function (app) {
  app.route('/api/mobile/companies/subsidiaries-employees')
    .all(policy.tokenAllowed).post(controller.list);
};
