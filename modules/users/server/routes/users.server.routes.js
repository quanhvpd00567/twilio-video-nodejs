'use strict';

module.exports = function (app) {
  var users = require('../controllers/users.server.controller');
  var tool = require('../controllers/tool.server.controller');
  var userPolicy = require('../policies/user.server.policy');

  // ウェッブ版のみ
  app.route('/api/auth/signin').post(users.signin);
  app.route('/api/auth/signout').get(users.signout);
  app.route('/api/auth/signout-ecommerce').get(users.signoutEcommerce);
  app.route('/api/auth/reset-pass').post(users.resetPass);
  app.route('/api/auth/reset-pass-ecommerce').post(users.resetPassEcommerce);
  app.route('/api/users/password').post(users.password);
  app.route('/api/auth/config').post(users.config);

  app.route('/api/ktc/pass').post(tool.pass);
  app.route('/api/ktc/sendMail').post(tool.sendMail);

  // Api confirm register for app
  app.route('/api/member/confirm').post(users.confirm);
  app.route('/api/member/confirm-update-email').post(users.confirmUpdateEmail);
  app.route('/api/users/cards').get(userPolicy.isAllowed, users.getListCard);
};
