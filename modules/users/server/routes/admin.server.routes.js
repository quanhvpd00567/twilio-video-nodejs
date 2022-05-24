'use strict';

/**
 * Module dependencies
 */
var adminPolicy = require('../policies/admin.server.policy'),
  admin = require('../controllers/admin.server.controller');

module.exports = function (app) {
  app.route('/api/user/home_info').post(adminPolicy.isAllowed, admin.home_info);
  require('./users.server.routes.js')(app);
};
