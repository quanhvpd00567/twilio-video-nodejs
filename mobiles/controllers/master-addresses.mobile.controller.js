'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  logger = require(path.resolve('./mobiles/controllers/logger.mobile.controller')),
  MasterAddress = mongoose.model('MasterAddress'),
  translate = require(path.resolve('./config/locales/mobile/ja.json'));

exports.findOneByZipCode = async function (req, res) {
  try {
    const { postcode } = req.body;
    if (!postcode) {
      return null;
    }

    const masterAddress = await MasterAddress.findOne({ zipcode: postcode }).lean();
    return res.json(masterAddress);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({
      message: translate['system.server.error']
    });
  }
};
