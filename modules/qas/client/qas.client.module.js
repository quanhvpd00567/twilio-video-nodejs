(function (app) {
  'use strict';

  app.registerModule('qas');
  app.registerModule('qas.admin');
  app.registerModule('qas.admin.routes', ['ui.router', 'core.routes', 'qas.admin.services']);
  app.registerModule('qas.admin.services');
  app.registerModule('qas.routes', ['ui.router', 'core.routes']);
  app.registerModule('qas.services');
}(ApplicationConfiguration));
