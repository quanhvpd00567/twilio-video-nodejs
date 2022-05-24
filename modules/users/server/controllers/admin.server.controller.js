'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  path = require('path'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  helpServerController = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants'));

exports.home_info = async function (req, res) {
  try {
    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: helpServerController.getMsLoc() });
  }
};
