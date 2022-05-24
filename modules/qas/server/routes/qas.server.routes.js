'use strict';

/**
 * Module dependencies
 */
var qasPolicy = require('../policies/qas.server.policy'),
  qas = require('../controllers/qas.server.controller');

module.exports = function (app) {
  // qas collection routes
  app.route('/api/qas')
    .post(qasPolicy.isAllowed, qas.create);

  app.route('/api/qas/paging').post(qasPolicy.isAllowed, qas.paging);
  app.route('/api/qas/:qaId/detail').get(qasPolicy.isAllowed, qas.detail);

  // Single qa routes
  app.route('/api/qas/:qaId')
    .get(qasPolicy.isAllowed, qas.read)
    .put(qasPolicy.isAllowed, qas.update)
    .delete(qasPolicy.isAllowed, qas.delete);

  // Finish by binding the qa middleware
  app.param('qaId', qas.qaByID);

};
