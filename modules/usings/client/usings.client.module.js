(function (app) {
  'use strict';

  app.registerModule('usings');
  app.registerModule('usings.municipality');
  app.registerModule('usings.municipality.routes', ['ui.router', 'core.routes', 'usings.municipality.services']);
  app.registerModule('usings.municipality.services');

  app.registerModule('usings.company');
  app.registerModule('usings.company.routes', ['ui.router', 'core.routes', 'usings.municipality.services']);
}(ApplicationConfiguration));
