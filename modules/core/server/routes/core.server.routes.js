'use strict';

module.exports = function (app) {
  // Root routing
  var core = require('../controllers/core.server.controller');
  var unique = require('../controllers/unique.server.controller');

  app.route('/api/validation/unique').post(unique.unique);

  // route server translate
  app.route('/api/data-translate').get(core.getDataTranslateClient);

  // Define error pages
  app.route('/server-error').get(core.renderServerError);

  // Return a 404 for all undefined api, module or lib routes
  app.route('/:url(api|modules|lib)/*').get(core.renderNotFound);

  // Define application route
  app.route('/*').get(core.renderIndex);
};
