(function (app) {
  'use strict';

  app.registerModule('sub_admins');
  app.registerModule('sub_admins.admin');
  app.registerModule('sub_admins.admin.routes', ['ui.router', 'core.routes', 'sub_admins.admin.services']);
  app.registerModule('sub_admins.admin.services');
  app.registerModule('sub_admins.routes', ['ui.router', 'core.routes']);
  app.registerModule('sub_admins.services');
}(ApplicationConfiguration));

