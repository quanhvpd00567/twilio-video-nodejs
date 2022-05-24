(function (app) {
  'use strict';

  app.registerModule('com_projects');
  app.registerModule('com_projects.admin');
  app.registerModule('com_projects.admin.routes', ['ui.router', 'core.routes', 'com_projects.admin.services']);
  app.registerModule('com_projects.admin.services');
  app.registerModule('com_projects.routes', ['ui.router', 'core.routes']);
  app.registerModule('com_projects.services');
  app.registerModule('com_projects.municipality');
  app.registerModule('com_projects.municipality.routes', ['ui.router', 'core.routes', 'com_projects.admin.services']);
}(ApplicationConfiguration));

