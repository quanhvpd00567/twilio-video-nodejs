(function (app) {
  'use strict';

  app.registerModule('settings_version');
  app.registerModule('settings_version.admin');
  app.registerModule('settings_version.admin.routes', ['ui.router', 'core.routes', 'settings_version.admin.services']);
  app.registerModule('settings_version.admin.services');
  app.registerModule('settings_version.routes', ['ui.router', 'core.routes']);
  app.registerModule('settings_version.services');
}(ApplicationConfiguration));
