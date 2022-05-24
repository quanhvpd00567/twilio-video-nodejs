(function (app) {
  'use strict';

  app.registerModule('ecommerces');
  app.registerModule('ecommerces.company');
  app.registerModule('ecommerces.company.routes', ['ui.router', 'core.routes', 'ecommerces.company.services']);
  app.registerModule('ecommerces.company.services');
}(ApplicationConfiguration));
