'use strict';

var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Device = mongoose.model('Device'),
  Config = mongoose.model('Config'),
  logger = require(path.resolve('./mobiles/controllers/logger.mobile.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  translate = require(path.resolve('./config/locales/mobile/ja.json'));
/**
 * Module dependencies
 */
exports.invokeRolesPolicies = function () {
};

exports.versionAllowed = function (req, res, next) {
  var version = req.headers.version || '';

  var os = req.headers.os || '';
  if (!version || version === '')
    return res.status(422).send({ message: translate['system.app.version.old'] });

  if (!os || os === '')
    return res.status(422).send({ message: translate['system.app.version.old'] });

  Config.findOne({}).exec(function (err, config) {
    if (err) {
      return next(err);
    }
    if (version && os && hasUpdateVersion(config, os, version)) {
      return res.status(201).send(dataVersion(config, os, req.language));
    }
    return next();
  });
};

exports.tokenAllowed = function (req, res, next) {
  var version = req.headers.version || '';
  var os = req.headers.os || '';

  if (!version || version === '')
    return res.status(422).send({ message: translate['system.app.version.old'] });
  if (!os || os === '')
    return res.status(422).send({ message: translate['system.app.version.old'] });

  Config.findOne({}).exec(function (err, config) {
    if (err) {
      return next(err);
    }
    if (version && os && hasUpdateVersion(config, os, version)) {
      return res.status(201).send(dataVersion(config, os, req.language));
    }

    var token = req.token;

    if (!token || token === '')
      return res.status(422).send({ message: translate['system.server.error'] });

    Device.findOne({ token: token }).exec((err, device) => {
      if (err) {
        logger.error(err);
        return res.status(500).send({ message: translate['system.server.error'] });
      }
      if (!device)
        return res.status(401).send({ message: translate['system.app.policy.user.null'] });

      User.findById(device.user)
        .populate('team')
        .exec(function (err, user) {
          if (err) {
            logger.error(err);
            return res.status(500).send({ message: translate['system.server.error'] });
          }
          if (!user || user.deleted)
            return res.status(401).send({ message: translate['system.app.policy.user.null'] });

          if (!isValidUser(user.roles)) {
            return res.status(401).send({ status: 401, message: translate['system.app.policy.role.invalid'] });
          }

          req.user = user;
          req.device = device;
          req.team = user.team;

          return next();
        });
    });
  });
};

function isValidUser(roles) {
  if (roles && roles[0] && roles.indexOf(constants.ROLE.EMPLOYEE) >= 0) {
    return true;
  }
  return false;
}

function hasUpdateVersion(config, os, version) {
  var cfgApp = config.app;
  var device_version = parseFloat(version);

  var ios_version = parseFloat(cfgApp.ios_version);
  var ios_version_require = parseFloat(cfgApp.ios_version_require);
  var android_version = parseFloat(cfgApp.android_version);
  var android_version_require = parseFloat(cfgApp.android_version_require);

  if (os === 'ios') {
    if (device_version >= ios_version) {
      return false;
    } else if (device_version < ios_version && device_version >= ios_version_require) {
      return false;
    } else {
      return dataVersion(config, os, constants.UPDATE_APP_TYPE.REQUIRED);
    }
  } else {
    if (device_version >= android_version) {
      return false;
    } else if (device_version < android_version && device_version >= android_version_require) {
      return false;
    } else {
      return dataVersion(config, os, constants.UPDATE_APP_TYPE.REQUIRED);
    }
  }
}

function dataVersion(config, os, updateAppType) {
  let obj = {
    link: '', version: '',
    message: translate['system.app.version.update_app_required'],
    required: true
  };
  if (updateAppType === constants.UPDATE_APP_TYPE.OPTIONAL) {
    obj.message = translate['system.app.version.update_app_optional'];
    obj.required = false;
  }

  const cfgApp = config.app;
  if (os === 'ios') {
    obj.link = cfgApp.ios_link;
    obj.version = cfgApp.ios_version;
  } else {
    obj.link = cfgApp.android_link;
    obj.version = cfgApp.android_version;
  }

  return obj;
}
