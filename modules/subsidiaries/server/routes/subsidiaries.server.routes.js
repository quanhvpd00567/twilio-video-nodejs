'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/subsidiaries.server.policy'),
  subsidiaryController = require('../controllers/subsidiaries.server.controller');

module.exports = function (app) {
  app.route('/api/subsidiaries').get(subsidiaryController.list);
  app.route('/api/subsidiaries').post(policy.isAllowed, subsidiaryController.create);
  app.route('/api/subsidiaries/all').get(policy.isAllowed, subsidiaryController.getByCompany);
  // app.route('/api/current-company').get(policy.isAllowed, employeeController.getCurrentCompany);

  // // // Single notice routes
  app.route('/api/subsidiaries/:subsidiaryId')
    .get(policy.isAllowed, subsidiaryController.detail)
    .put(policy.isAllowed, subsidiaryController.update)
    .delete(policy.isAllowed, subsidiaryController.delete);

  // // // Finish by binding the notice middleware
  app.param('subsidiaryId', subsidiaryController.subsidiaryById);
};
