(function (app) {
  'use strict';

  app.registerModule('requests_authorization');
  app.registerModule('requests_authorization.municipality');
  app.registerModule('requests_authorization.municipality.routes', ['ui.router', 'core.routes', 'requests_authorization.municipality.services']);
  app.registerModule('requests_authorization.municipality.services');
  app.registerModule('requests_authorization.services');
  app.registerModule('requests_authorization.routes', ['ui.router', 'core.routes']);
}(ApplicationConfiguration));

