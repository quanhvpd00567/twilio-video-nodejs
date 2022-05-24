(function (app) {
  'use strict';

  app.registerModule('companies');
  app.registerModule('companies.admin');
  app.registerModule('companies.admin.routes', ['ui.router', 'core.routes', 'companies.admin.services']);
  app.registerModule('companies.company');
  app.registerModule('companies.company.routes', ['ui.router', 'core.routes', 'companies.admin.services']);
  app.registerModule('companies.admin.services');
  app.registerModule('companies.routes', ['ui.router', 'core.routes']);
  app.registerModule('companies.services');
  app.registerModule('companies-guest.routes', ['ui.router', 'core.routes', 'users.admin.services']);
}(ApplicationConfiguration));

