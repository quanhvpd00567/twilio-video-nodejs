'use strict';

/**
 * Module dependencies
 */
var passport = require('passport'),
  User = require('mongoose').model('User'),
  Request = require('mongoose').model('Request'),
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
    if (user && user.municipality) {
      const numberOfPendingRequests = await Request.countDocuments({ deleted: false, municipality: user.municipality, status: constants.REQUEST_STATUS.PENDING });
      user.numberOfPendingRequests = numberOfPendingRequests;
    }
    done(null, user);
  });
  config.utils.getGlobbedPaths(path.join(__dirname, './strategies/**/*.js')).forEach(function (strategy) {
    require(path.resolve(strategy))(config);
  });
  app.use(passport.initialize());
  app.use(passport.session());
};
