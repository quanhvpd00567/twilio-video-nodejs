'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  logger = require(path.resolve('./mobiles/controllers/logger.mobile.controller')),
  Product = mongoose.model('Product'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  translate = require(path.resolve('./config/locales/mobile/ja.json'));

exports.list = async function (req, res) {
  try {
    const { page, limit } = req.body;
    const options = {
      sort: '-created', page: page || 1, limit: limit ? Number(limit) : constants.LIMIT_ITEM_PER_PAGE_MOBILE, lean: true
    };
    let query = { deleted: false, location: req.user.location };
    const result = await Product.paginate(query, options);

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({
      message: translate['system.server.error']
    });
  }
};
