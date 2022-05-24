(function (app) {
  'use strict';

  app.registerModule('products');
  app.registerModule('products.municipality');
  app.registerModule('products.municipality.routes', ['ui.router', 'core.routes', 'products.municipality.services']);
  app.registerModule('products.municipality.services');
  app.registerModule('products.routes', ['ui.router', 'core.routes']);
  app.registerModule('products.services');
}(ApplicationConfiguration));

