(function (app) {
  'use strict';

  app.registerModule('projects');
  app.registerModule('projects.municipality');
  app.registerModule('projects.municipality.routes', ['ui.router', 'core.routes', 'projects.municipality.services']);
  app.registerModule('projects.municipality.services');

  app.registerModule('projects.company');
  app.registerModule('projects.company.routes', ['ui.router', 'core.routes', 'projects.municipality.services']);
}(ApplicationConfiguration));
