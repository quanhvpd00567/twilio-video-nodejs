'use strict';

module.exports = function (app) {
  var controller = require('../controllers/users.mobile.controller'),
    policy = require('../policies/core.mobile.policy.js');

  app.route('/api/mobile/users/config').post(controller.getConfiguration);

  app.route('/api/mobile/users/signin').post(policy.versionAllowed, controller.signin);
  app.route('/api/mobile/users/signout').post(policy.tokenAllowed, controller.signout);

  // app.route('/api/mobile/users/change-password').post(policy.tokenAllowed, controller.changePassword);
  // app.route('/api/mobile/users/reset-password').post(policy.versionAllowed, controller.resetPassword);

  app.route('/api/mobile/users/setting').post(policy.tokenAllowed, controller.setting);
  app.route('/api/mobile/users/token').post(policy.tokenAllowed, controller.verify_token);
  app.route('/api/mobile/users/profile').post(policy.tokenAllowed, controller.profile);

  app.route('/api/mobile/users/registration').post(policy.tokenAllowed, controller.notif_registrationId);
  app.route('/api/mobile/users/notif_clear').post(policy.tokenAllowed, controller.notif_clear);
  app.route('/api/mobile/users/notif_decrease').post(policy.tokenAllowed, controller.notif_decrease);

  app.route('/api/mobile/users/home_info').post(policy.tokenAllowed, controller.home_info);
};
