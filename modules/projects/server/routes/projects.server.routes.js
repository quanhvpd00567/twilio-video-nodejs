'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/projects.server.policy'),
  controller = require('../controllers/projects.server.controller');

module.exports = function (app) {
  // projects collection routes
  app.route('/api/projects/image').all(policy.isAllowed).post(controller.uploadImage);

  app.route('/api/projects')
    .post(policy.isAllowed, controller.create);

  app.route('/api/projects/paging').post(policy.isAllowed, controller.paging);
  app.route('/api/projects/:projectId/comprojects/count').get(policy.isAllowed, controller.countNumberOfComprojects);

  app.route('/api/:municipalityId/projects/paging').post(policy.isAllowed, controller.pagingProjectsOfMunicipality);
  app.route('/api/:municipalityId/projects').post(policy.isAllowed, controller.getProjects);

  // Single project routes
  app.route('/api/projects/:projectId')
    .get(policy.isAllowed, controller.read)
    .put(policy.isAllowed, controller.update)
    .delete(policy.isAllowed, controller.delete);

  // Finish by binding the project middleware
  app.param('projectId', controller.projectIdByID);

};
