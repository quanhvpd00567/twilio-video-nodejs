'use strict';

/**
 * Module dependencies
 */
var controller = require('../controllers/products.mobile.controller.js'),
  policy = require('../policies/core.mobile.policy.js');

module.exports = function (app) {
  app.route('/api/mobile/products/list')
    .all(policy.tokenAllowed).post(controller.list);
};
