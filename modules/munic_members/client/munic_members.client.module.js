(function (app) {
  'use strict';

  app.registerModule('munic_members');
  app.registerModule('munic_members.municipality');
  app.registerModule('munic_members.municipality.routes', ['ui.router', 'core.routes', 'munic_members.municipality.services']);
  app.registerModule('munic_members.municipality.services');
  app.registerModule('munic_members.routes', ['ui.router', 'core.routes']);
  app.registerModule('munic_members.services');
}(ApplicationConfiguration));

