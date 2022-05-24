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
  // let session = null;
  try {
    let data = req.body;

    if (!data) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    let subsidiary = data.subsidiary;

    // check code unique
    let isExists = await Department.findOne({ subsidiary: subsidiary, code: data.code, deleted: false }).lean();

    if (isExists) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'departments.form.code.error.exists') });
    }

    let dataSave = {
      company: req.user.company,
      subsidiary: subsidiary,
      name: data.name,
      code: data.code
    };

    let department = new Department(dataSave);

    await department.save();

    // company.code = await help.getRandomCode(6, 'company');

    // session = await mongoose.startSession();
    // session.startTransaction();


    // await session.commitTransaction();
    // session.endSession();


    return res.json(true);
  } catch (error) {
    logger.error(error);
    // abortTransaction(session);
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

    let company = req.user.company;

    var limit = help.getLimit(condition);
    var sort = help.getSort(condition);
    // var options = { page: page, limit: limit };

    let query = getQuery(condition, req.user);

    const options = {
      sort: sort,
      page: page,
      limit: limit,
      collation: { locale: 'ja' },
      populate: [
        { path: 'company', select: 'name' },
        { path: 'subsidiary', select: 'name' }
      ]
    };

    let result = await Department.paginate(query, options);

    // const aggregates = getQueryAggregate(condition, company);
    // let result = await Department.aggregatePaginate(Department.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    // result = help.parseAggregateQueryResult(result, page);

    return res.json(result);

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.paging = async function (req, res) {
  try {
    var condition = req.query || {};
    var page = condition.page || 1;

    // let company = req.user.company;

    var limit = help.getLimit(condition);
    // var sort = help.getSort(condition);
    var options = { page: page, limit: limit };


    const aggregates = getQueryAggregate(condition, req.user);
    let result = await Department.aggregatePaginate(Department.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

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
  let session = null;
  try {
    let department = req.model;
    let data = req.body;
    const auth = req.user;

    // Check code unique

    let isExists = await Department.findOne({ deleted: false, code: { $ne: department.code, $eq: data.code }, company: data.company }).lean();
    console.log(isExists);

    if (isExists) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'departments.form.code.error.exists') });
    }

    let dataSave = {
      subsidiary: data.subsidiary,
      name: data.name,
      code: data.code
    };

    await Department.updateOne({ _id: department._id }, dataSave);

    return res.json(true);
  } catch (error) {
    logger.error(error);
    abortTransaction(session);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  let session = null;
  try {
    const department = req.model;
    session = await mongoose.startSession();
    session.startTransaction();

    let isExists = await User.findOne({ e_department: department._id, deleted: false }).lean();
    if (isExists) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'departments.list.error.exists') });
    }

    // Delete department
    await Department.updateOne({ _id: department._id, deleted: false }, { deleted: true }).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.json(true);

  } catch (error) {
    logger.error(error);
    abortTransaction(session);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getAllByCompany = async function (req, res) {
  try {
    let company = (req.user && req.user.company) || req.query.companyId;

    if (req.user && help.isAdminOrSubAdmin(req.user.roles)) {
      company = req.query.companyId;
    }
    let conditions = { company: { $eq: company }, deleted: false };
    if (req.query.subsidiary) {
      conditions.subsidiary = { $eq: req.query.subsidiary };
    }

    Department.find(conditions)
      .select('name')
      .then(departments => {
        return res.json(departments);
      });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.departmentId = async function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  Department.findOne({ _id: id })
    .populate({
      path: 'company',
      select: 'name'
    })
    .populate({
      path: 'subsidiary',
      select: 'name'
    })
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
function getQueryAggregate(condition, auth) {
  var company = auth.company;
  let and_arr = [{
    deleted: false,
    company: company
  }];

  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { code: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  console.log(condition);
  if (condition.subsidiary && condition.subsidiary !== '') {
    and_arr.push({ subsidiary: new mongoose.Types.ObjectId(condition.subsidiary) });
  }

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'users',
      let: { e_departments: '$_id' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$e_department', '$$e_departments'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }, {
        $group: {
          _id: {},
          total: { $sum: 1 }
        }
      }],
      as: 'users'
    }
  }, {
    $unwind: {
      path: '$users',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      user_count: { $cond: { if: { $ifNull: ['$users', false] }, then: '$users.total', else: 0 } }
    }
  });

  aggregates.push({
    $lookup: {
      from: 'subsidiaries',
      let: { subsidiaries: '$subsidiary' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$_id', '$$subsidiaries'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }],
      as: 'subsidiary'
    }
  }, {
    $unwind: {
      path: '$subsidiary',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      subsidiary_name: '$subsidiary.name'
    }
  });

  aggregates.push({
    $project: {
      subsidiary: 0,
      users: 0
    }
  });

  const sort = help.getSortAggregate(condition);
  if (sort) {
    aggregates.push({
      $sort: sort
    });
  }

  return aggregates;
}

function getQuery(condition, auth) {
  var company = auth.company;
  var and_arr = [{ deleted: false, company: company }];

  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { code: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.subsidiary && condition.subsidiary !== '') {
    and_arr.push({ subsidiary: condition.subsidiary });
  }

  return { $and: and_arr };
}


function abortTransaction(session) {
  if (session) {
    session.abortTransaction().then(() => {
      session.endSession();
    });
  }
}
