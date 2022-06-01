'use strict';

/**
 * Module dependencies
 */
var settingsPolicy = require('../policies/settings.server.policy'),
  settings = require('../controllers/settings.server.controller');

module.exports = function (app) {
  // Single Setting routes
  app.route('/api/settings/pushVersion')
    .post(settingsPolicy.isAllowed, settings.push);
  app.route('/api/settings/config')
    .get(settingsPolicy.isAllowed, settings.read)
    .put(settingsPolicy.isAllowed, settings.update);

  app.route('/api/info').get(settings.getTermPolicty);
};
