'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  QA = mongoose.model('QA'),
  path = require('path'),
  _ = require('lodash'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

mongoose.Promise = require('bluebird');

exports.create = async function (req, res) {
  try {
    let data = req.body;
    if (!data) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    let qa = new QA(data);
    await qa.save();
    return res.json(qa);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.paging = async function (req, res) {
  try {
    var condition = req.body.condition || {};
    var page = condition.page || 1;
    var query = getQuery(condition);
    var sort = help.getSort(condition);
    var limit = help.getLimit(condition);
    const options = {
      sort: sort,
      page: page,
      limit: limit,
      collation: { locale: 'ja' }
    };
    const result = await QA.paginate(query, options);
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.detail = async function (req, res) {
  try {
    const qaId = req.params.qaId;
    const result = await QA.findOne({ deleted: false, _id: qaId })
      .lean();

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.read = function (req, res) {
  res.json(req.model);
};

exports.update = async function (req, res) {
  try {
    var qa = req.model;

    const objectQA = await QA.findOne({ deleted: false, _id: qa._id }).lean();
    if (!objectQA) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'qa.server.error.not_found') });
    }

    qa = _.extend(qa, req.body);
    await qa.save();

    return res.json(qa);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  try {
    let qa = req.model;
    await QA.updateOne({ _id: qa._id }, { deleted: true });

    return res.json(qa);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.qaByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  QA.findById(id)
    .exec(function (err, qa) {
      if (err) {
        logger.error(err);
        return next(err);
      } else if (!qa) {
        return next(new Error('お知らせが見つかりません。'));
      }

      req.model = qa;
      next();
    });
};

/** ====== PRIVATE ========= */
function getQuery(condition) {
  var and_arr = [{ deleted: false }];
  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { question: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { answer: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  // if (condition.created_min) {
  //   and_arr.push({ created: { '$gte': condition.created_min } });
  // }
  // if (condition.created_max) {
  //   and_arr.push({ created: { '$lte': condition.created_max } });
  // }
  return { $and: and_arr };
}
