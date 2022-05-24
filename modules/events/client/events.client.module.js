(function (app) {
  'use strict';

  app.registerModule('events');
  app.registerModule('events.company');
  app.registerModule('events.company.routes', ['ui.router', 'core.routes', 'events.company.services']);
  app.registerModule('events.company.services');

  app.registerModule('events.municipality');
  app.registerModule('events.municipality.routes', ['ui.router', 'core.routes', 'events.company.services']);

  app.registerModule('events.admin');
  app.registerModule('events.admin.routes', ['ui.router', 'core.routes', 'events.company.services']);

}(ApplicationConfiguration));
