(function (app) {
  'use strict';

  app.registerModule('notices');
  app.registerModule('notices.admin');
  app.registerModule('notices.admin.routes', ['ui.router', 'core.routes', 'notices.admin.services']);
  app.registerModule('notices.admin.services');
  app.registerModule('notices.routes', ['ui.router', 'core.routes']);
  app.registerModule('notices.services');
}(ApplicationConfiguration));
