'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/com_projects.server.policy'),
  employeeController = require('../controllers/com_projects.server.controller');

module.exports = function (app) {
  app.route('/api/com-projects').get(policy.isAllowed, employeeController.list);
  app.route('/api/com-projects/export').get(policy.isAllowed, employeeController.export);
  app.route('/api/com-projects/:comProjectId').get(policy.isAllowed, employeeController.detail);
  app.route('/api/com-projects/:comProjectId').put(policy.isAllowed, employeeController.update);
  app.route('/api/com-projects/paticipants/:comProjectId').get(policy.isAllowed, employeeController.paticipants);
  app.route('/api/com-projects/paticipants/:comProjectId/export').get(policy.isAllowed, employeeController.paticipantsExport);
  app.route('/api/weekly/report').get(employeeController.exportWeeklyStepsReport);
};
