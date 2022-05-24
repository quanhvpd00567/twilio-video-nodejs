(function (app) {
  'use strict';

  app.registerModule('credits');
  app.registerModule('credits.admin');
  app.registerModule('credits.admin.routes', ['ui.router', 'core.routes', 'credits.admin.services']);
  app.registerModule('credits.admin.services');
  app.registerModule('credits.routes', ['ui.router', 'core.routes']);
  app.registerModule('credits.services');
}(ApplicationConfiguration));
