(function (app) {
  'use strict';

  app.registerModule('features_authorization');
  app.registerModule('features_authorization.company');
  app.registerModule('features_authorization.company.routes', ['ui.router', 'core.routes', 'features_authorization.company.services']);
  app.registerModule('features_authorization.company.services');
  app.registerModule('features_authorization.routes', ['ui.router', 'core.routes']);
  app.registerModule('features_authorization.services');

  app.registerModule('features_authorization.municipality');
  app.registerModule('features_authorization.municipality.routes', ['ui.router', 'core.routes', 'features_authorization.company.services']);
}(ApplicationConfiguration));

