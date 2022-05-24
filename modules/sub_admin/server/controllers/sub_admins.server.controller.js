'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Company = mongoose.model('Company'),
  User = mongoose.model('User'),
  Subsidiary = mongoose.model('Subsidiary'),
  Event = mongoose.model('Event'),
  Department = mongoose.model('Department'),
  encoding = require('encoding-japanese'),
  path = require('path'),
  fs = require('fs'),
  _ = require('lodash'),
  https = require('https'),
  request = require('request'),
  xml2js = require('xml2js'),
  queryString = require('query-string'),
  generator = require('generate-password'),
  config = require(path.resolve('./config/config')),
  mailerServerUtil = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

const lang = 'ja';

exports.create = async function (req, res) {
  try {
    let data = req.body;

    if (!data) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    data.roles = [constants.ROLE.SUB_ADMIN];

    const email_lower = trimAndLowercase(data.email);

    // Check email exists;
    const isExists = await User.findOne({ email_lower, deleted: false }).lean();

    if (isExists) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }

    let user = new User(data);

    await user.save();

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};


/**
 * Handle get list event
 *
 * @param {*} req
 * @param {*} res
 */
exports.list = async function (req, res) {
  try {
    var condition = req.query || {};
    var page = condition.page || 1;

    var limit = help.getLimit(condition);
    var sort = help.getSort(condition);

    let and_arr = [{
      deleted: false,
      roles: { $in: [constants.ROLE.SUB_ADMIN] }
    }];

    if (condition.keyword && condition.keyword !== '') {
      var or_arr = [
        { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
        { email: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
      ];
      and_arr.push({ $or: or_arr });
    }

    const options = {
      sort: sort,
      page: page,
      limit: limit,
      collation: { locale: 'ja' }
    };

    let result = await User.paginate({ $and: and_arr }, options);

    return res.json(result);

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.detail = async function (req, res) {
  try {
    const auth = req.user;

    return res.json(req.model);

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.update = async function (req, res) {
  try {
    let subAdmin = req.model;
    let data = req.body;

    const email_lower = trimAndLowercase(data.email);

    // Check email exists;
    const isExists = await User.findOne({ email_lower, deleted: false, _id: { $ne: subAdmin._id } }).lean();

    if (isExists) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }

    let dataSave = {
      name: data.name,
      email: data.email
    };

    await User.updateOne({ _id: subAdmin._id }, dataSave);

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  try {
    await User.updateOne({ _id: req.model._id }, { deleted: true });

    return res.json(true);

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.subAdminId = async function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  User.findOne({ _id: id })
    .exec(function (err, event) {
      if (err) {
        logger.error(err);
        return next(err);
      } else if (!event) {
        return next(new Error('お知らせが見つかりません。'));
      }
      req.model = event;
      next();
    });
};

/** ====== PRIVATE ========= */
function getQueryAggregate(condition, companyIds) {
  let and_arr = [{
    company: { $in: companyIds },
    deleted: false
  }];

  // if (condition.kind && condition.kind !== '') {
  //   and_arr.push({ kind: { $eq: Number(condition.kind) } });
  // }

  // if (condition.created_min) {
  //   and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  // }
  // if (condition.created_max) {
  //   and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  // }


  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  let matchUser = {
    $and: [
      { 'company.deleted': { $eq: false } }
    ]
  };

  // aggregates.push({
  //   $lookup: {
  //     from: 'subsidiaries',
  //     localField: 'company',
  //     foreignField: '_id',
  //     as: 'company'
  //   }
  // }, {
  //   $unwind: '$company'
  // }, {
  //   $match: matchUser
  // }, {
  //   $addFields: {
  //     company_id: { $convert: { input: '$company._id', to: 'string' } },
  //     company_name: '$company.name'
  //   }
  // });

  const sort = help.getSortAggregate(condition);
  if (sort) {
    aggregates.push({
      $sort: sort
    });
  }

  return aggregates;
}


function abortTransaction(session) {
  if (session) {
    session.abortTransaction().then(() => {
      session.endSession();
    });
  }
}


function trimAndLowercase(data) {
  if (!data) {
    return '';
  }

  data = data.trim();
  data = data && data.toLowerCase();

  return data;
}
