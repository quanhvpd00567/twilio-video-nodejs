(function (app) {
  'use strict';

  app.registerModule('products');
  app.registerModule('products.admin');
  app.registerModule('products.admin.routes', ['ui.router', 'core.routes', 'products.admin.services']);
  app.registerModule('products.admin.services');
  app.registerModule('products.routes', ['ui.router', 'core.routes']);
  app.registerModule('products.services');
}(ApplicationConfiguration));

