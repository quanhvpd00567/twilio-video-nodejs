(function (app) {
  'use strict';

  app.registerModule('pointHistories');
  app.registerModule('pointHistories.admin');
  app.registerModule('pointHistories.admin.routes', ['ui.router', 'core.routes', 'pointHistories.admin.services']);
  app.registerModule('pointHistories.admin.services');
  app.registerModule('pointHistories.routes', ['ui.router', 'core.routes']);
  app.registerModule('pointHistories.services');
}(ApplicationConfiguration));
