'use strict';

/**
 * Module dependencies
 */
var controller = require('../controllers/events.mobile.controller'),
  policy = require('../policies/core.mobile.policy.js');

module.exports = function (app) {
  app.route('/api/mobile/events/list')
    .all(policy.tokenAllowed).post(controller.list);
  app.route('/api/mobile/events/detail')
    .all(policy.tokenAllowed).post(controller.detail);
  app.route('/api/mobile/events/join')
    .all(policy.tokenAllowed).post(controller.join);
  app.route('/api/mobile/events/paging_histories').all(policy.tokenAllowed).post(controller.pagingHistories);
  app.route('/api/mobile/events/comprojects').all(policy.tokenAllowed).post(controller.listComprojectsOfEvent);
  app.route('/api/mobile/events/list_others')
    .all(policy.tokenAllowed).post(controller.list_others);
};
