'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/departments.server.policy'),
  companyController = require('../controllers/departments.server.controller');

module.exports = function (app) {
  // app.route('/api/departments/all').get(policy.isAllowed, companyController.getAll);
  // app.route('/api/departments').get(policy.isAllowed, companyController.list);
  // // app.route('/api/companies').post(policy.isAllowed, companyController.create);
  app.route('/api/departments').get(policy.isAllowed, companyController.list);
  app.route('/api/departments/paging').get(policy.isAllowed, companyController.paging);
  app.route('/api/departments').post(policy.isAllowed, companyController.create);
  app.route('/api/departments/all-company').get(companyController.getAllByCompany);
  // app.route('/api/get-compamy-number').get(companyController.getCompanyNumber);
  // app.route('/api/company/info').get(policy.isAllowed, companyController.getInfo);

  // Single notice routes
  app.route('/api/departments/:departmentId')
    .get(policy.isAllowed, companyController.detail)
    .put(policy.isAllowed, companyController.update)
    .delete(policy.isAllowed, companyController.delete);

  // Finish by binding the notice middleware
  app.param('departmentId', companyController.departmentId);
};
