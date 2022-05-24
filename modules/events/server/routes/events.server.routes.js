'use strict';

/**
 * Module dependencies
 */
var eventsPolicy = require('../policies/events.server.policy'),
  events = require('../controllers/events.server.controller');

module.exports = function (app) {
  app.route('/api/events/paging_home').post(eventsPolicy.isAllowed, events.pagingForHome);
  app.route('/api/events/opening_home').get(eventsPolicy.isAllowed, events.getDataOfEventOpeningForHome);
  app.route('/api/events/paging').post(eventsPolicy.isAllowed, events.paging);
  app.route('/api/:municipalityId/projects/apply').post(eventsPolicy.isAllowed, events.applyProjects);
  app.route('/api/events/detail/:eventId').get(eventsPolicy.isAllowed, events.detail);
  app.route('/api/events/:eventId/comprojects/paging').post(eventsPolicy.isAllowed, events.pagingComprojects);
  app.route('/api/events/paging-municipality').post(eventsPolicy.isAllowed, events.pagingForMunicipality);
  app.route('/api/events/:eventId/update-pay-and-send-status').put(eventsPolicy.isAllowed, events.updatePayAndSendStatus);
  app.route('/api/events/munic-export').post(eventsPolicy.isAllowed, events.municExport);

  // Single event routes
  app.route('/api/events/:eventId')
    .get(eventsPolicy.isAllowed, events.read)
    .put(eventsPolicy.isAllowed, events.update)
    .delete(eventsPolicy.isAllowed, events.delete);

  // Finish by binding the event middleware
  app.param('eventId', events.eventById);
};
