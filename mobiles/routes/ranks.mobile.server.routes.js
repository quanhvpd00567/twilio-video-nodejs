'use strict';

/**
 * Module dependencies
 */
var controller = require('../controllers/ranks.mobile.controller'),
  policy = require('../policies/core.mobile.policy.js');

module.exports = function (app) {
  app.route('/api/mobile/ranks/paging_employees')
    .all(policy.tokenAllowed).post(controller.pagingRankOfEmployees);
  app.route('/api/mobile/ranks/paging_employees_rank_growth_rate')
    .all(policy.tokenAllowed).post(controller.pagingRankOfEmployeesGrowthRate);
  app.route('/api/mobile/ranks/paging_subsidiaries')
    .all(policy.tokenAllowed).post(controller.pagingRankOfSubsidiaries);
  app.route('/api/mobile/ranks/paging_departments')
    .all(policy.tokenAllowed).post(controller.pagingRankOfDepartments);
};
