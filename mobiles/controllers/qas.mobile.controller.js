'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  QA = mongoose.model('QA'),
  translate = require(path.resolve('./config/locales/mobile/ja.json')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller'));

exports.list = async function (req, res) {
  try {
    const result = await QA.find({ deleted: false }).sort({ display_order: 1 }).lean();
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};
