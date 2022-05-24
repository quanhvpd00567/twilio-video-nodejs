'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/sub_admins.server.policy'),
  subAdminController = require('../controllers/sub_admins.server.controller');

module.exports = function (app) {
  app.route('/api/sub-admins').get(policy.isAllowed, subAdminController.list);
  app.route('/api/sub-admins').post(policy.isAllowed, subAdminController.create);

  // Single notice routes
  app.route('/api/sub-admins/:subAdminId')
    .get(policy.isAllowed, subAdminController.detail)
    .put(policy.isAllowed, subAdminController.update)
    .delete(policy.isAllowed, subAdminController.delete);

  // Finish by binding the notice middleware
  app.param('subAdminId', subAdminController.subAdminId);
};
