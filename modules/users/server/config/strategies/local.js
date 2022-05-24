'use strict';

/**
 * Module dependencies
 */
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  User = require('mongoose').model('User'),
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants'));

module.exports = function () {
  // Use local strategy
  passport.use(new LocalStrategy({
    usernameField: 'usernameOrEmail',
    passwordField: 'password'
  }, function (usernameOrEmail, password, done) {
    User.findOne({
      $or: [
        { token_ec_site: usernameOrEmail },
        { username: usernameOrEmail.toLowerCase() },
        { email: usernameOrEmail.toLowerCase() }
      ],
      deleted: false
    }, async function (err, user) {
      if (err) return done(err);

      if (!user) {
        return done(null, false, { message: 'ログインIDかパスワードが違います。' });
      }

      if (usernameOrEmail === user.token_ec_site) {
        user.token_ec_site = null;
        await user.save();
        return done(null, user);
      }
      if (!user || !user.authenticate(password) || !checkRole(user.roles))
        return done(null, false, { message: 'ログインIDかパスワードが違います。' });
      return done(null, user);
    });
  }));

  function checkRole(roles) {
    const ROLE = constants.ROLE;
    if (roles && roles[0] && [ROLE.ADMIN, ROLE.SUB_ADMIN, ROLE.COMPANY, ROLE.EMPLOYEE, ROLE.MUNIC_ADMIN, ROLE.MUNIC_MEMBER].indexOf(roles[0]) >= 0) {
      return true;
    }
    return false;
  }
};
