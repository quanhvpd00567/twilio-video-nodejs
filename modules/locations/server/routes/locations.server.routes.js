'use strict';

/**
 * Module dependencies
 */
var locationsPolicy = require('../policies/locations.server.policy'),
  locations = require('../controllers/locations.server.controller');

module.exports = function (app) {
  // locations collection routes
  app.route('/api/locations')
    .post(locationsPolicy.isAllowed, locations.create);
  app.route('/api/zoomus/create-room')
    .post(locationsPolicy.isAllowed, locations.createRoomZoom);

  app.route('/api/locations/paging').post(locationsPolicy.isAllowed, locations.paging);

  // Single location routes
  app.route('/api/locations/:locationId')
    .get(locationsPolicy.isAllowed, locations.read)
    .put(locationsPolicy.isAllowed, locations.update)
    .delete(locationsPolicy.isAllowed, locations.delete);

  // Finish by binding the location middleware
  app.param('locationId', locations.locationByID);

};
