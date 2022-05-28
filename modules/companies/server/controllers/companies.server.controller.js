'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Company = mongoose.model('Company'),
  User = mongoose.model('User'),
  encoding = require('encoding-japanese'),
  path = require('path'),
  _ = require('lodash'),
  request = require('request'),
  xml2js = require('xml2js'),
  queryString = require('query-string'),
  generator = require('generate-password'),
  config = require(path.resolve('./config/config')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

const lang = 'ja';

exports.create = async function (req, res) {
  let session = null;
  try {
    let data = req.body;

    if (!data) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    let isAdminCreate = req.user && req.user.roles[0] === constants.ROLE.ADMIN;
    // Admin create company and generator password
    if (isAdminCreate) {
      data.password = generator.generate({ length: 8, numbers: true });
    }

    const dataCompany = {
      name: data.name,
      kind: data.kind,
      number: data.number
    };

    const dataAccount = {
      first_name: data.admin.first_name,
      last_name: data.admin.last_name,
      name: `${data.admin.last_name} ${data.admin.first_name}`,
      password: data.password,
      email: data.admin.email,
      phone: data.admin.phone,
      department: data.admin.department,
      number: data.admin.employee_no,
      roles: [constants.ROLE.COMPANY, constants.ROLE.EMPLOYEE]
    };

    dataAccount.is_required_update_password = (req.user && req.user.roles[0] === constants.ROLE.ADMIN);

    const dataSub = {
      name: data.name,
      kind: data.kind,
      number: data.number,
      isHQ: true
    };

    // Check email exists;
    const email_lower = trimAndLowercase(dataAccount.email);
    const user = await User.findOne({ email_lower, deleted: false }).lean();
    if (user) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }

    const isExistsNumber = await Company.findOne({ number: dataCompany.number, deleted: false }).lean();
    if (isExistsNumber) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'companies.form.number.error.exists') });
    }

    let company = new Company(dataCompany);
    let account = new User(dataAccount);
    company.code = await help.getRandomCode(6, 'company');
    session = await mongoose.startSession();
    session.startTransaction();

    company = await company.save({ session });
    // set company
    account.company = company._id;
    account = await account.save({ session });

    // update company
    await Company.updateOne({ _id: company._id }, { admin: account._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.json(company);
  } catch (error) {
    logger.error(error);
    abortTransaction(session);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getAll = async function (req, res) {
  try {
    const condition = {
      deleted: false,
      $or: [
        { is_testing: null },
        { is_testing: false }
      ]
    };
    const result = await Company.find(condition).select('name kind').lean();
    return res.json(result);
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
    var options = { page: page, limit: limit };

    const aggregates = getQueryAggregate(condition);
    let result = await Company.aggregatePaginate(Company.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
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
    if (auth.roles[0] === constants.ROLE.ADMIN) {

      let company = await Company.aggregate([
        {
          $lookup: {
            from: 'users',
            let: { company_id: '$_id' },
            pipeline: [{
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$company', '$$company_id'] },
                    { $eq: ['$deleted', false] },
                    { $in: [constants.ROLE.EMPLOYEE, '$roles'] }
                  ]
                }
              }
            }],
            as: 'employees'
          }
        }, {
          $lookup: {
            from: 'users',
            localField: 'admin',
            foreignField: '_id',
            as: 'account'
          }
        }, {
          $unwind: '$account'
        }, {
          $match: {
            $and: [{ _id: new mongoose.Types.ObjectId(req.model._id), deleted: false }]
          }
        }, {
          $addFields: {
            employee_count: { $size: '$employees' },
            admin: {
              _id: '$account._id',
              email: '$account.email',
              name: { $concat: ['$account.last_name', ' ', '$account.first_name'] },
              department: '$account.department',
              phone: '$account.phone',
              last_name: '$account.last_name',
              first_name: '$account.first_name'
            }
          }
        }, {
          $project: {
            _id: 1,
            name: 1,
            admin: 1,
            code: 1,
            kind: 1,
            number: 1,
            employee_count: 1,
            created: 1
          }
        }
      ]).allowDiskUse(true).limit(1);

      if (company.length === 0) {
        return res.status(422).send({ message: help.getMsLoc() });
      }

      return res.json(company[0]);
    }

    return res.json(req.model);

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.update = async function (req, res) {
  let session = null;
  try {
    let company = req.model;
    let data = req.body;

    console.log(company._id);

    const auth = req.user;

    // update info company
    if (auth.roles[0] === constants.ROLE.COMPANY || (data && data.isAdminUpdatedByFeatureAuthorization)) {
      const isExistsNumber = await Company.findOne({ number: data.number, deleted: false, _id: { $ne: company._id } }).lean();
      if (isExistsNumber) {
        return res.status(422).send({ message: help.getMsLoc(lang, 'companies.form.number.error.exists') });
      }
      let dataToUpdate = {};
      if (data.name) { dataToUpdate.name = data.name; }
      if (data.number) { dataToUpdate.number = data.number; }
      if (data.ranking_to_show) { dataToUpdate.ranking_to_show = data.ranking_to_show; }
      company = await Company.updateOne({ _id: company._id }, dataToUpdate);

      return res.json(company);
    }

    const dataCompanyUpdate = {
      name: data.name,
      number: data.number,
      kind: data.kind,
      updated: new Date()
    };

    const dataAccountUpdate = {
      first_name: data.admin.first_name,
      last_name: data.admin.last_name,
      name: data.admin.last_name + ' ' + data.admin.first_name,
      // email: data.admin.email,
      phone: data.admin.phone,
      department: data.admin.department
    };

    let account = await User.findOne({ deleted: false, _id: req.model.admin });

    if (!account) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    const isExistsNumber = await Company.findOne({ number: dataCompanyUpdate.number, deleted: false, _id: { $ne: company._id } }).lean();
    if (isExistsNumber) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'companies.form.number.error.exists') });
    }

    // Check email exists;
    // const email_lower = trimAndLowercase(dataAccountUpdate.email);
    // const user = await User.findOne({ email_lower, deleted: false, _id: { $ne: account._id } }).lean();
    // if (user) {
    //   return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    // }

    // if (data.password && data.password !== '') {
    //   dataAccountUpdate.password = data.password;
    // }

    session = await mongoose.startSession();
    session.startTransaction();

    // Update company
    company = await Company.updateOne({ _id: company._id }, dataCompanyUpdate).session(session);
    account = _.extend(account, dataAccountUpdate);
    await account.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json(company);
  } catch (error) {
    logger.error(error);
    abortTransaction(session);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  let session = null;
  try {
    const company = req.model;
    session = await mongoose.startSession();
    session.startTransaction();

    // 1: Remove all employee and company admin
    await User.updateMany({ company: company._id, deleted: false }, { $set: { deleted: true } }).session(session);

    // 5: Delete company info
    await Company.updateOne({ _id: company._id, deleted: false }, { deleted: true }).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.json(true);

  } catch (error) {
    logger.error(error);
    abortTransaction(session);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getInfo = async function (req, res) {
  const auth = req.user;
  const conpany = await Company.findOne({ _id: auth.company || req.query.companyId }).select('name kind number ranking_to_show').lean();
  return res.json(conpany);
};

exports.companyById = async function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  Company.findOne({ _id: id })
    .populate({
      path: 'admin',
      select: 'first_name last_name email department phone'
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
function getQueryAggregate(condition) {
  let and_arr = [{
    deleted: false,
    $or: [
      { is_testing: null },
      { is_testing: false }
    ]
  }];

  if (condition.kind && condition.kind !== '') {
    and_arr.push({ kind: { $eq: Number(condition.kind) } });
  }

  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  // Match user
  let matchUser = {
    $and: [
      { 'account.deleted': { $eq: false } }
    ]
  };

  aggregates.push({
    $lookup: {
      from: 'users',
      localField: 'admin',
      foreignField: '_id',
      as: 'account'
    }
  }, {
    $unwind: '$account'
  }, {
    $match: matchUser
  }, {
    $addFields: {
      user_id: { $convert: { input: '$account._id', to: 'string' } },
      user_email: '$account.email',
      admin_name: { $concat: ['$account.last_name', ' ', '$account.first_name'] },
      phone: '$account.phone'
    }
  });

  let second_and_arr = [];
  if (condition.keyword && condition.keyword !== '') {
    second_and_arr.push({ name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
    // second_and_arr.push({ code: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
    second_and_arr.push({ number: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
    second_and_arr.push({ user_email: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
  }

  if (second_and_arr.length > 0) {
    aggregates.push({
      $match: {
        $or: second_and_arr
      }
    });
  }

  aggregates.push({
    $project: {
      account: 0
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

function trimAndLowercase(data) {
  if (!data) {
    return '';
  }

  data = data.trim();
  data = data && data.toLowerCase();

  return data;
}

function getRoleAuth(auth) {
  return auth.roles[0];
}

function abortTransaction(session) {
  if (session) {
    session.abortTransaction().then(() => {
      session.endSession();
    });
  }
}


exports.getCompanyNumber = async function getCompanyNumber(req, res) {
  try {
    let name = req.query.name;
    if (name === undefined) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    // name = name.replace('株式会社', '');
    // name = name.replace('有限会社', '');
    // convert to zenkaku
    name = encoding.toZenkakuCase(name);

    let params = {
      id: config.houjin.id,
      name: name,
      type: config.houjin.type,
      history: config.houjin.history
    };

    const q = queryString.stringify(params);
    queryString.stringify(params);
    var options = {
      url: config.houjin.hostname + config.houjin.path + q,
      method: 'GET'
    };

    request(options, function (error, response) {
      if (response.statusCode === 400) {
        const arg = response.body.split(',');
        if (arg.length > 1) {
          return res.status(422).send({ message: arg[1] });
        }
      }

      if (error) throw new Error(error);
      var parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
      parser.parseStringPromise(response.body)
        .then(function (result) {
          if (result.corporations.count === '1') {
            result.corporations.corporation = [result.corporations.corporation];
          }

          let data = {
            docs: result.corporations.corporation || [],
            totalDocs: Number(result.corporations.count)
          };

          return res.json(data);
        })
        .catch(function (err) {
          logger.error(err);
          return res.status(422).send({ message: help.getMsLoc() });
        });
    });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};
