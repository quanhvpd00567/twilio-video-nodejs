'use strict';

/**
 * Module dependencies
 */
var passport = require('passport'),
  User = require('mongoose').model('User'),
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  config = require(path.resolve('./config/config'));

/**
 * Module init function
 */
module.exports = function (app) {
  passport.serializeUser(function (user, done) {
    done(null, user._id);
  });
  passport.deserializeUser(async function (_id, done) {
    let user = await User.findOne({ _id: _id, deleted: false }).select('-salt -password');
    done(null, user);
  });
  config.utils.getGlobbedPaths(path.join(__dirname, './strategies/**/*.js')).forEach(function (strategy) {
    require(path.resolve(strategy))(config);
  });
  app.use(passport.initialize());
  app.use(passport.session());
};
