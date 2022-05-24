'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/requests-authorization.server.policy'),
  controller = require('../controllers/requests-authorization.server.controller');

module.exports = function (app) {
  // requests-authorization collection routes
  app.route('/api/requests')
    .post(policy.isAllowed, controller.paging);

  app.route('/api/requests-authorization/:requestId/reject')
    .post(policy.isAllowed, controller.reject);
  app.route('/api/requests-authorization/:requestId/approve')
    .post(policy.isAllowed, controller.approve);
  app.route('/api/requests-authorization/:requestId/delete')
    .post(policy.isAllowed, controller.delete);
};
