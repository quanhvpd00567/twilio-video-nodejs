'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Municipality = mongoose.model('Municipality'),
  User = mongoose.model('User'),
  Product = mongoose.model('Product'),
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
      department: data.admin.department,
      roles: constants.ROLE.MUNIC_ADMIN,
      number: data.admin.number
    };

    const email_lower = trimAndLowercase(dataAccount.email);
    const [isEmailExisting, isNumberExisting] = await Promise.all([
      User.findOne({ email_lower, deleted: false }).lean(),
      User.findOne({ number: dataAccount.number, roles: constants.ROLE.MUNIC_ADMIN, deleted: false }).lean()
    ]);

    if (isEmailExisting) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }
    if (isNumberExisting) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'municipalities.form.server.error.number_exists') });
    }

    let munic = new Municipality(dataMunic);
    let account = new User(dataAccount);

    session = await mongoose.startSession();
    session.startTransaction();

    munic.admin = account._id;
    munic = await munic.save({ session });

    // set municipality
    account.municipality = munic._id;
    account = await account.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send mail
    try {
      // mailerServerUtil.sendMailCreateCompanyOrMunic(dataAccount.email, dataAccount.password, dataAccount.first_name, dataAccount.last_name);
    } catch (error) {
      logger.error(error);
    }

    return res.json(munic);
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

    // Remove all munic member and munic admin
    await User.updateMany({ municipality: munic._id, deleted: false }, { $set: { deleted: true } }).session(session);

    // 3: Remove all product
    await Product.updateMany({ municipality: munic._id, deleted: false }, { $set: { deleted: true } }).session(session);

    //  Delete munic
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

    if (req.user.roles[0] === constants.ROLE.ADMIN || req.user.roles[0] === constants.ROLE.SUB_ADMIN) {
      municId = req.query.municipalityId;
    }
    if (!mongoose.Types.ObjectId.isValid(municId)) {
      return res.status(400).send({
        message: 'お知らせが見つかりません。'
      });
    }

    const munic = await Municipality.findOne({ _id: municId }).lean();

    return res.json(munic);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.isUpdatedPaymentMethod = async function (req, res) {
  try {
    let municipalityId = '';
    if (req.user.roles[0] === constants.ROLE.ADMIN || req.user.roles[0] === constants.ROLE.SUB_ADMIN) {
      municipalityId = req.body.municipalityId;
    } else {
      municipalityId = req.user.municipality;
    }
    // const municipalityId = req.user.municipality;
    if (!municipalityId) {
      return res.json(false);
    }

    const municipality = await Municipality.findById(municipalityId).select('methods').lean();
    const isUpdated = municipality && municipality.methods && municipality.methods.length > 0;
    return res.json(isUpdated);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.updateInfo = async function (req, res) {
  try {
    const body = req.body;
    const auth = req.user;
    const bankUpdate = {
      methods: body.methods,
      bank_code: body.bank_code,
      bank_name: body.bank_name,
      branch_code: body.branch_code,
      branch_name: body.branch_name,
      bank_type: body.bank_type,
      bank_number: body.bank_number,
      bank_owner: body.bank_owner,
      bank_owner_kana: body.bank_owner_kana
    };

    const munic = await Municipality.updateOne({ _id: auth.municipality }, bankUpdate);
    return res.json(munic);
  } catch (error) {

    logger.error(error);
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

exports.updateMunic = async function (req, res) {
  try {
    const auth = req.user;
    const body = req.body;
    const updateData = {};


    let municipality = auth.municipality;
    if (req.user.roles[0] === constants.ROLE.ADMIN || req.user.roles[0] === constants.ROLE.SUB_ADMIN) {
      municipality = body.municipalityId;
    }

    if (body.question || body.question === '') {
      updateData.question = body.question;
    }

    if (body.max_quantity) {
      updateData.max_quantity = body.max_quantity;
    }

    if (body.checklist || body.checklist === '') {
      updateData.checklist = body.checklist;
    }

    if (body.contact_name) {
      updateData.contact_name = body.contact_name;
    }

    if (body.contact_tel) {
      updateData.contact_tel = body.contact_tel;
    }

    if (body.contact_mail) {
      updateData.contact_mail = body.contact_mail;
    }

    if (body.fax) {
      updateData.fax = body.fax;
    }

    if (body.is_apply_times === true || body.is_apply_times === false) {
      updateData.is_apply_times = body.is_apply_times;
    }

    if (body.is_setting_gift_bows === true || body.is_setting_gift_bows === false) {
      updateData.is_setting_gift_bows = body.is_setting_gift_bows;
    }

    if (body.is_setting_docs === true || body.is_setting_docs === false) {
      updateData.is_setting_docs = body.is_setting_docs;
    }

    if (body.is_apply_need) {
      updateData.is_apply_need = body.is_apply_need;
    }
    updateData.is_usage_system = body.is_usage_system;

    const munic = await Municipality.updateOne({ _id: municipality }, updateData);
    return res.json(munic);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getMunicipalityContactInfo = async function (req, res) {
  try {
    const municipalityId = req.params.municipalityId;
    if (!municipalityId) {
      return res.json(null);
    }

    const municipality = await Municipality.findById(municipalityId).select('contact_name contact_tel contact_mail').lean();
    if (!municipality || (!municipality.contact_name && !municipality.contact_tel && !municipality.contact_mail)) {
      return res.json(null);
    }

    return res.json(municipality);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

/** ====== PRIVATE ========= */
function getQuery(condition) {
  var and_arr = [{ deleted: false }];
  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { code: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.prefecture && condition.prefecture !== '') {
    and_arr.push({ prefecture: condition.prefecture });
  }

  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  return { $and: and_arr };
}

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