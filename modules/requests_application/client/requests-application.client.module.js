(function (app) {
  'use strict';

  app.registerModule('requests_application');
  app.registerModule('requests_application.municipality');
  app.registerModule('requests_application.municipality.routes', ['ui.router', 'core.routes', 'requests_application.municipality.services']);
  app.registerModule('requests_application.municipality.services');
  app.registerModule('requests_application.services');
  app.registerModule('requests_application.routes', ['ui.router', 'core.routes']);
}(ApplicationConfiguration));

