'use strict';

/**
 * Module dependencies
 */
var controller = require('../controllers/qas.mobile.controller'),
  policy = require('../policies/core.mobile.policy.js');

module.exports = function (app) {
  app.route('/api/mobile/qas/list')
    .all(policy.tokenAllowed).post(controller.list);
};
