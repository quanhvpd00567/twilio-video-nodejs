(function (app) {
  'use strict';

  app.registerModule('employees');
  app.registerModule('employees.admin');
  app.registerModule('employees.admin.routes', ['ui.router', 'core.routes', 'employees.admin.services']);
  app.registerModule('employees.admin.services');
  app.registerModule('employees.routes', ['ui.router', 'core.routes']);
  app.registerModule('employees.services');
  app.registerModule('employees.company');
  app.registerModule('employees.company.routes', ['ui.router', 'core.routes', 'employees.admin.services']);
  app.registerModule('employees-guest.routes', ['ui.router', 'core.routes', 'employees.admin.services']);
}(ApplicationConfiguration));

