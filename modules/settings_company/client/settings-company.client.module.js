(function (app) {
  'use strict';

  app.registerModule('settings_company');
  app.registerModule('settings_company.company');
  app.registerModule('settings_company.company.routes', ['ui.router', 'core.routes']);
  app.registerModule('settings_company.routes', ['ui.router', 'core.routes']);
}(ApplicationConfiguration));

