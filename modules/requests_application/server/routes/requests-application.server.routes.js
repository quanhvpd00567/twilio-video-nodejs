'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/requests-application.server.policy'),
  controller = require('../controllers/requests-application.server.controller');

module.exports = function (app) {
  // requests-application collection routes
  app.route('/api/requests-items')
    .post(policy.isAllowed, controller.list);
  app.route('/api/requests-items/:requestItemId')
    .get(policy.isAllowed, controller.read)
    .post(policy.isAllowed, controller.update);
  app.route('/api/submit-application')
    .post(policy.isAllowed, controller.submit);
  app.route('/api/resubmit-application')
    .post(policy.isAllowed, controller.resubmit);
  app.route('/api/remove-request-item-application')
    .post(policy.isAllowed, controller.removeRequestItem);
  app.route('/api/remove-request-application')
    .post(policy.isAllowed, controller.removeRequest);

  app.param('requestItemId', controller.getById);
};
