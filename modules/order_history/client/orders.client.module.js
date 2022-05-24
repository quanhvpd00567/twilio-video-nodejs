(function (app) {
  'use strict';

  app.registerModule('orders');
  app.registerModule('orders.admin');
  app.registerModule('orders.admin.routes', ['ui.router', 'core.routes', 'orders.admin.services']);
  app.registerModule('orders.admin.services');
  app.registerModule('orders.routes', ['ui.router', 'core.routes']);
  app.registerModule('orders.services');
}(ApplicationConfiguration));

