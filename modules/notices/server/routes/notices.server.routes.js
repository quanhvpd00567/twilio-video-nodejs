'use strict';

/**
 * Module dependencies
 */
var noticesPolicy = require('../policies/notices.server.policy'),
  notices = require('../controllers/notices.server.controller');

module.exports = function (app) {
  // notices collection routes
  app.route('/api/notices')
    .post(noticesPolicy.isAllowed, notices.create);

  app.route('/api/notices/paging').post(noticesPolicy.isAllowed, notices.paging);
  app.route('/api/notices/stop').post(noticesPolicy.isAllowed, notices.stop);
  app.route('/api/notices/export').get(noticesPolicy.isAllowed, notices.export);
  app.route('/api/notices/:noticeId/detail').get(noticesPolicy.isAllowed, notices.detail);

  // Single notice routes
  app.route('/api/notices/:noticeId')
    .get(noticesPolicy.isAllowed, notices.read)
    .put(noticesPolicy.isAllowed, notices.update)
    .delete(noticesPolicy.isAllowed, notices.delete);

  // Finish by binding the notice middleware
  app.param('noticeId', notices.noticeByID);

};
