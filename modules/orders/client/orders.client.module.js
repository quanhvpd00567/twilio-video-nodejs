(function (app) {
  'use strict';

  app.registerModule('orders');
  app.registerModule('orders.municipality');
  app.registerModule('orders.admin1');
  app.registerModule('orders.municipality.routes', ['ui.router', 'core.routes', 'orders.municipality.services']);
  app.registerModule('orders.admin.routes', ['ui.router', 'core.routes', 'orders.municipality.services']);
  app.registerModule('orders.municipality.services');
  app.registerModule('orders.routes', ['ui.router', 'core.routes']);
  app.registerModule('orders.services');
}(ApplicationConfiguration));

