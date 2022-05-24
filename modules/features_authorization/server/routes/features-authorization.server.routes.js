'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/features-authorization.server.policy'),
  controller = require('../controllers/features-authorization.server.controller');

module.exports = function (app) {
  // features-authorization collection routes
  app.route('/api/features-authorization')
    .get(policy.isAllowed, controller.get);

  app.route('/api/features-authorization')
    .post(policy.isAllowed, controller.update);
};
