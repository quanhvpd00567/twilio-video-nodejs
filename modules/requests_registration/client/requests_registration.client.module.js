(function (app) {
  'use strict';

  app.registerModule('requests_registration');
  app.registerModule('requests_registration.admin');
  app.registerModule('requests_registration.admin.routes', ['ui.router', 'core.routes', 'requests_registration.admin.services']);
  app.registerModule('requests_registration.admin.services');
  app.registerModule('requests_registration.routes', ['ui.router', 'core.routes']);
  app.registerModule('requests_registration.services');
}(ApplicationConfiguration));

