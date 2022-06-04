'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/orders.server.policy'),
  orderController = require('../controllers/orders.server.controller');

module.exports = function (app) {
  app.route('/api/orders').get(policy.isAllowed, orderController.list);
  app.route('/api/orders/export').get(policy.isAllowed, orderController.exportOrder);
  app.route('/api/orders/check-export').get(policy.isAllowed, orderController.checkExported);
  app.route('/api/orders/admin-export').get(policy.isAllowed, orderController.adminExport);
  app.route('/api/orders/admin-list').get(policy.isAllowed, orderController.adminList);
  app.route('/api/orders/excport-excel').get(policy.isAllowed, orderController.exportOrderAdmin);
  // app.route('/api/munic-members').post(policy.isAllowed, employeeController.create);
  // app.route('/api/munic-members/remove-multi').post(policy.isAllowed, employeeController.removeMulti);

  // // // Single notice routes
  // app.route('/api/munic-members/:memberId')
  //   .get(policy.isAllowed, employeeController.detail)
  //   .put(policy.isAllowed, employeeController.update)
  //   .delete(policy.isAllowed, employeeController.delete);

  // // // Finish by binding the notice middleware
  // app.param('memberId', employeeController.memberById);
};
