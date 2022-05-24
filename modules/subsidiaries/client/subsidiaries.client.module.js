(function (app) {
  'use strict';

  app.registerModule('subsidiaries');
  app.registerModule('subsidiaries.admin');
  app.registerModule('subsidiaries.admin.routes', ['ui.router', 'core.routes', 'subsidiaries.admin.services']);
  app.registerModule('subsidiaries.admin.services');
  app.registerModule('subsidiaries.routes', ['ui.router', 'core.routes']);
  app.registerModule('subsidiaries.services');
  app.registerModule('subsidiaries.company');
  app.registerModule('subsidiaries.company.routes', ['ui.router', 'core.routes', 'subsidiaries.admin.services']);

}(ApplicationConfiguration));

