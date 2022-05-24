'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/munic_members.server.policy'),
  employeeController = require('../controllers/munic_members.server.controller');

module.exports = function (app) {
  app.route('/api/munic-members').get(policy.isAllowed, employeeController.list);
  app.route('/api/munic-members').post(policy.isAllowed, employeeController.create);
  app.route('/api/munic-members/remove-multi').post(policy.isAllowed, employeeController.removeMulti);
  app.route('/api/munic-members/only-one-munic-admin').post(policy.isAllowed, employeeController.isOnlyOneMunicAdmin);

  // // Single notice routes
  app.route('/api/munic-members/:memberId')
    .get(policy.isAllowed, employeeController.detail)
    .put(policy.isAllowed, employeeController.update)
    .delete(policy.isAllowed, employeeController.delete);

  // // Finish by binding the notice middleware
  app.param('memberId', employeeController.memberById);
};
