'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/employees.server.policy'),
  employeeController = require('../controllers/employees.server.controller');

module.exports = function (app) {
  app.route('/api/employees').get(policy.isAllowed, employeeController.list);
  app.route('/api/employees').post(policy.isAllowed, employeeController.create);
  app.route('/api/employees/import').post(policy.isAllowed, employeeController.import);
  app.route('/api/employees/remove-multi').post(policy.isAllowed, employeeController.removeMulti);
  app.route('/api/employees/export').get(policy.isAllowed, employeeController.export);
  app.route('/api/employees/create-qrcode').get(policy.isAllowed, employeeController.createQrCode);
  app.route('/api/employees/only-one-company-account').post(policy.isAllowed, employeeController.isOnlyOneCompanyAccount);


  app.route('/api/employees/info-company').post(employeeController.getInfoCompany);
  app.route('/api/employees/guest-create').post(employeeController.guestCreate);


  // // Single notice routes
  app.route('/api/employees/:employeeId')
    .get(policy.isAllowed, employeeController.detail)
    .put(policy.isAllowed, employeeController.update)
    .delete(policy.isAllowed, employeeController.delete);

  // // Finish by binding the notice middleware
  app.param('employeeId', employeeController.employeeById);
};
