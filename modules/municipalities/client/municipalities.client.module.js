(function (app) {
  'use strict';

  app.registerModule('municipalities');
  app.registerModule('municipalities.admin');
  app.registerModule('municipalities.admin.routes', ['ui.router', 'core.routes', 'municipalities.admin.services']);
  app.registerModule('municipalities.admin.services');

  app.registerModule('municipalities.munic');
  app.registerModule('municipalities.munic.routes', ['ui.router', 'core.routes', 'municipalities.admin.services']);
}(ApplicationConfiguration));

