'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/usings.server.policy'),
  controller = require('../controllers/usings.server.controller');

module.exports = function (app) {
  // usings collection routes
  app.route('/api/usings')
    .post(policy.isAllowed, controller.create);
  app.route('/api/usings/paging').post(policy.isAllowed, controller.paging);

  // Single using routes
  app.route('/api/usings/:usingId')
    .get(policy.isAllowed, controller.read)
    .put(policy.isAllowed, controller.update)
    .delete(policy.isAllowed, controller.delete);

  // Finish by binding the using middleware
  app.param('usingId', controller.usingIdByID);

};
