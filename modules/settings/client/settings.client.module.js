(function (app) {
  'use strict';

  app.registerModule('settings');
  app.registerModule('settings.admin');
  app.registerModule('settings.admin.routes', ['ui.router', 'core.routes', 'settings.admin.services']);
  app.registerModule('settings.admin.services');
  app.registerModule('settings.routes', ['ui.router', 'core.routes']);
  app.registerModule('settings.services');

  app.registerModule('settings-guest.routes', ['ui.router', 'core.routes', 'settings.admin.services']);
  app.registerModule('settings.guest');
}(ApplicationConfiguration));
