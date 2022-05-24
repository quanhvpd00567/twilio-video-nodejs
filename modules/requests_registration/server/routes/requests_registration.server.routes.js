'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/requests_registration.server.policy'),
  controller = require('../controllers/requests_registration.server.controller');

module.exports = function (app) {
  // requests registration collection routes
  app.route('/api/requests-registration')
    .get(policy.isAllowed, controller.get);

  app.route('/api/check-permission-request')
    .post(policy.isAllowed, controller.checkPermistion);
};
