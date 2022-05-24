'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/companies.server.policy'),
  companyController = require('../controllers/companies.server.controller');

module.exports = function (app) {
  app.route('/api/companies/all').get(policy.isAllowed, companyController.getAll);
  app.route('/api/companies').get(policy.isAllowed, companyController.list);
  // app.route('/api/companies').post(policy.isAllowed, companyController.create);
  app.route('/api/companies').post(companyController.create);
  app.route('/api/get-compamy-number').get(companyController.getCompanyNumber);
  app.route('/api/company/info').get(policy.isAllowed, companyController.getInfo);

  // Single notice routes
  app.route('/api/companies/:companyId')
    .get(policy.isAllowed, companyController.detail)
    .put(policy.isAllowed, companyController.update)
    .delete(policy.isAllowed, companyController.delete);

  // Finish by binding the notice middleware
  app.param('companyId', companyController.companyById);
};
