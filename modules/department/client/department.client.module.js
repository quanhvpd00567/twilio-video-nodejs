(function (app) {
  'use strict';

  app.registerModule('departments');
  app.registerModule('departments.company');
  app.registerModule('departments.company.routes', ['ui.router', 'core.routes', 'departments.company.services']);
  app.registerModule('departments.company.services');
  app.registerModule('departments.routes', ['ui.router', 'core.routes']);
  app.registerModule('departments.services');
  app.registerModule('departments.services');
}(ApplicationConfiguration));

