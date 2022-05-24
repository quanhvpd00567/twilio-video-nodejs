'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  controller = require('../controllers/notices.mobile.controller.js'),
  policy = require('../policies/core.mobile.policy.js');

module.exports = function (app) {
  // app.route('/api/mobile/notices/list')
  //   .all(policy.tokenAllowed).post(controller.m_list);
  // app.route('/api/mobile/notices/total')
  //   .all(policy.tokenAllowed).post(controller.m_total);
  // app.route('/api/mobile/notices/detail')
  //   .all(policy.tokenAllowed).post(controller.m_detail);
  // app.route('/api/mobile/notices/delete')
  //   .all(policy.tokenAllowed).post(controller.m_delete);
  // app.route('/api/mobile/notices/read')
  //   .all(policy.tokenAllowed).post(controller.m_read);
  // app.route('/api/mobile/notices/latest')
  //   .all(policy.tokenAllowed).post(controller.get5LatestUnreadNotices);
};
