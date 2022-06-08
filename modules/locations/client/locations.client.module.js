(function (app) {
  'use strict';

  app.registerModule('locations');
  app.registerModule('locations.admin');
  app.registerModule('locations.admin.routes', ['ui.router', 'core.routes', 'locations.admin.services']);
  app.registerModule('locations.admin.services');
  app.registerModule('locations.routes', ['ui.router', 'core.routes']);
  app.registerModule('locations.services');

  app.registerModule('locations.munic');
  app.registerModule('locations.munic.routes', ['ui.router', 'core.routes', 'locations.admin.services']);
}(ApplicationConfiguration));
