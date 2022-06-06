'use strict';

var validator = require('validator'),
  path = require('path'),
  moment = require('moment-timezone'),
  config = require(path.resolve('./config/config')),
  masterdata = require(path.resolve('./config/lib/master-data')),
  dataTranslateClient = require(path.resolve('./config/locales/client/ja.json'));
moment.tz.setDefault('Asia/Tokyo');
moment.locale('ja');

/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {
  var userAgent = req.headers['user-agent'];
  if (isInvalidBrowser(userAgent)) {
    return res.render('modules/core/server/views/not-support');
  }

  var safeUserObject = null;
  if (req.user) {
    console.log('TCL: exports.renderIndex -> req.user', req.user);
    safeUserObject = {
      _id: req.user._id,
      name: validator.escape(req.user.name || ''),
      email: validator.escape(req.user.email),
      created: req.user.created.toString(),
      municipalityId: req.user.municipality,
      numberOfPendingRequests: req.user.numberOfPendingRequests,
      is_can_config_version: req.user.is_can_config_version,
      is_required_update_password: req.user.is_required_update_password,
      roles: req.user.roles
    };

    res.render('modules/core/server/views/index', {
      user: JSON.stringify(safeUserObject),
      sharedConfig: JSON.stringify(config.shared),
      masterdata: JSON.stringify(masterdata.masterdata),
      translatedata: JSON.stringify(dataTranslateClient)
    });
  } else {
    res.render('modules/core/server/views/login', {
      user: JSON.stringify(safeUserObject),
      sharedConfig: JSON.stringify(config.shared),
      masterdata: JSON.stringify(masterdata.masterdata),
      translatedata: JSON.stringify(dataTranslateClient)
    });
  }
};

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
  res.status(500).render('modules/core/server/views/500', {
    error: 'Oops! Something went wrong...'
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {
  res.status(404).format({
    'text/html': function () {
      res.render('modules/core/server/views/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    default: function () {
      res.send('Path not found');
    }
  });
};

exports.getDataTranslateClient = function (req, res, next) {
  res.send(dataTranslateClient);
};

function isInvalidBrowser(userAgent) {
  return !(userAgent.indexOf('Firefox') > -1 || userAgent.indexOf('Chrome') > -1 || userAgent.indexOf('Safari') > -1 || userAgent.indexOf('EdgA') > -1 || userAgent.indexOf('Edge') > -1);
}
