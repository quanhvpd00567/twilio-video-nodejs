'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Municipality = mongoose.model('Municipality'),
  User = mongoose.model('User'),
  Product = mongoose.model('Product'),
  Location = mongoose.model('Location'),
  path = require('path'),
  _ = require('lodash'),
  mailerServerUtil = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
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

    const dataMunic = {
      name: data.name,
      prefecture: data.prefecture,
      code: await help.getRandomCode(6, 'munic')
    };

    const dataAccount = {
      first_name: data.admin.first_name,
      last_name: data.admin.last_name,
      name: data.admin.last_name + ' ' + data.admin.first_name,
      password: data.password,
      email: data.admin.email,
      phone: data.admin.phone,
      roles: constants.ROLE.MUNICIPALITY,
      number: data.admin.number,
      department: data.admin.department
    };

    const email_lower = trimAndLowercase(dataAccount.email);
    const [isEmailExisting, isNumberExisting] = await Promise.all([
      User.findOne({ email_lower, deleted: false }).lean(),
      dataAccount.number ? User.findOne({ number: dataAccount.number, roles: constants.ROLE.MUNICIPALITY, deleted: false }).lean() : null
    ]);

    if (isEmailExisting) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }
    if (dataAccount.number && isNumberExisting) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'municipalities.form.server.error.number_exists') });
    }

    let municipalityCreated = new Municipality(dataMunic);
    let accountCreated = new User(dataAccount);

    session = await mongoose.startSession();
    session.startTransaction();

    municipalityCreated.admin = accountCreated._id;
    municipalityCreated = await municipalityCreated.save({ session });

    // set municipality
    accountCreated.municipality = municipalityCreated._id;
    accountCreated = await accountCreated.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send mail
    try {
      mailerServerUtil.sendMailAdminCreateMunicipality(req.user.email, accountCreated.email, dataAccount.password, accountCreated.name, municipalityCreated.name);
    } catch (error) {
      logger.error(error);
    }

    return res.json(municipalityCreated);
  } catch (error) {
    logger.error(error);
    abortTransaction(session);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.list = async function (req, res) {
  try {
    const condition = req.query || {};
    var page = condition.page || 1;
    const limit = help.getLimit(condition);
    const options = { page: page, limit: limit };

    const aggregates = getQueryAggregate(condition);
    let result = await Municipality.aggregatePaginate(Municipality.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
  } catch (error) {
    logger.error(error);
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
    const municipalities = await Municipality.find(condition).select('name').lean();
    return res.json(municipalities);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.detail = async function (req, res) {
  try {
    return res.json(req.model);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.update = async function (req, res) {
  let session = null;
  try {
    const auth = req.user;
    const data = req.body;
    if (auth.roles[0] !== constants.ROLE.ADMIN) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    // Prepare data update
    const dataUpdate = {
      name: data.name,
      prefecture: data.prefecture
    };

    const dataAccountUpdate = {
      first_name: data.admin.first_name,
      last_name: data.admin.last_name,
      name: data.admin.last_name + ' ' + data.admin.first_name,
      email: data.admin.email,
      number: data.admin.number,
      phone: data.admin.phone,
      department: data.admin.department
    };

    if (data.password && data.password !== '') {
      dataAccountUpdate.password = data.password;
    }

    let account = await User.findOne({ deleted: false, _id: req.model.admin });
    if (!account) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'municipalities.server.error.not_found') });
    }

    // Check email exists
    if (account.email !== dataAccountUpdate.email) {
      const email_lower = trimAndLowercase(dataAccountUpdate.email);
      const isEmailExisting = await User.findOne({ email_lower, deleted: false, _id: { $ne: account._id } }).lean();
      if (isEmailExisting) {
        return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
      }
    }
    // Check number exists
    if (dataAccountUpdate.number && account.number !== dataAccountUpdate.number) {
      const isNumberExisting = await User.findOne({ number: dataAccountUpdate.number, deleted: false, _id: { $ne: account._id } }).lean();
      if (isNumberExisting) {
        return res.status(422).send({ message: help.getMsLoc(lang, 'municipalities.form.server.error.number_exists') });
      }
    }

    session = await mongoose.startSession();
    session.startTransaction();

    await Municipality.updateOne({ _id: req.model._id }, dataUpdate, { session });

    account = _.extend(account, dataAccountUpdate);
    await account.save({ session });

    await session.commitTransaction();
    session.endSession();

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
    const munic = req.model;
    session = await mongoose.startSession();
    session.startTransaction();

    // Remove all munic admin
    await User.updateMany({ municipality: munic._id, deleted: false }, { $set: { deleted: true } }).session(session);

    // Remove all products
    await Product.updateMany({ municipality: munic._id, deleted: false }, { $set: { deleted: true } }).session(session);

    // Remove all locations
    await Location.updateMany({ municipality: munic._id, deleted: false }, { $set: { deleted: true } }).session(session);

    // Delete munic
    await Municipality.updateOne({ _id: munic._id, deleted: false }, { deleted: true }).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.json(true);
  } catch (error) {
    logger.error(error);
    abortTransaction(session);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.info = async function (req, res) {
  try {
    let municId = req.user.municipality;
    const munic = await Municipality.findOne({ _id: municId, deleted: false }).populate({ path: 'admin', select: '-password' }).lean();
    return res.json(munic);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.updateByMunic = async function (req, res) {
  let session = null;
  try {
    const body = req.body;
    const dataAccountUpdate = {
      first_name: body.admin.first_name,
      last_name: body.admin.last_name,
      email: body.admin.email,
      phone: body.admin.phone,
      department: body.admin.department
    };

    let account = await User.findOne({ deleted: false, _id: body.admin._id });
    if (!account) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'municipalities.server.error.not_found') });
    }

    // Check email exists
    if (account.email !== dataAccountUpdate.email) {
      const email_lower = trimAndLowercase(dataAccountUpdate.email);
      const isEmailExisting = await User.findOne({ email_lower, deleted: false, _id: { $ne: account._id } }).lean();
      if (isEmailExisting) {
        return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
      }
    }

    session = await mongoose.startSession();
    session.startTransaction();

    await Municipality.updateOne({ _id: body._id }, body, { session });

    account = _.extend(account, dataAccountUpdate);
    await account.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json(true);
  } catch (error) {
    logger.error(error);
    abortTransaction(session);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.municById = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  Municipality.findOne({ _id: id })
    .populate({
      path: 'admin',
      select: 'first_name last_name email department phone number'
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
function trimAndLowercase(data) {
  if (!data) {
    return '';
  }

  data = data.trim();
  data = data && data.toLowerCase();

  return data;
}

function abortTransaction(session) {
  if (session) {
    session.abortTransaction().then(() => {
      session.endSession();
    });
  }
}

function getQueryAggregate(condition) {
  let and_arr = [{
    deleted: false,
    $or: [
      { is_testing: null },
      { is_testing: false }
    ]
  }];

  if (condition.prefecture) {
    and_arr.push({ prefecture: { $eq: String(condition.prefecture) } });
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
