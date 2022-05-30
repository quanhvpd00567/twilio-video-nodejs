'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/municipalities.server.policy'),
  municController = require('../controllers/municipalities.server.controller');

module.exports = function (app) {
  app.route('/api/municipalities/all').get(policy.isAllowed, municController.getAll);
  app.route('/api/municipalities').get(policy.isAllowed, municController.list);
  app.route('/api/municipalities').post(municController.create);

  app.route('/api/municipalities/info').get(policy.isAllowed, municController.info);
  app.route('/api/municipalities/update-munic').post(policy.isAllowed, municController.updateMunic);

  // Single notice routes
  app.route('/api/municipalities/:municId')
    .get(policy.isAllowed, municController.detail)
    .put(policy.isAllowed, municController.update)
    .delete(policy.isAllowed, municController.delete);

  // Finish by binding the notice middleware
  app.param('municId', municController.municById);
};
