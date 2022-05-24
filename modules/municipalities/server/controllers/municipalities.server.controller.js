'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Municipality = mongoose.model('Municipality'),
  User = mongoose.model('User'),
  Using = mongoose.model('Using'),
  Product = mongoose.model('Product'),
  Project = mongoose.model('Project'),
  Point = mongoose.model('Point'),
  Event = mongoose.model('Event'),
  PointLog = mongoose.model('PointLog'),
  RequestItem = mongoose.model('RequestItem'),
  Comproject = mongoose.model('Comproject'),
  generator = require('generate-password'),
  path = require('path'),
  moment = require('moment'),
  _ = require('lodash'),
  mailerServerUtil = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  eventsHelper = require(path.resolve('./modules/events/server/helpers/events.server.helper')),
  check_point_expire = require(path.resolve('./config/jobs/check-point-expire')),
  FEATURE_MUNICIPALITY = require(path.resolve('./config/lib/master-data')).masterdata.FEATURE_MUNICIPALITY,
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

const lang = 'ja';

exports.create = async function (req, res) {
  let session = null;
  try {
    let data = req.body;
    if (!data) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    const isAdminCreate = req.user && req.user.roles[0] === constants.ROLE.ADMIN;
    // Admin create company and generator password
    if (isAdminCreate) {
      data.password = generator.generate({ length: 8, numbers: true });
    }

    const dataMunic = {
      name: data.name,
      prefecture: data.prefecture,
      // fax: data.fax,
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

    dataAccount.is_required_update_password = (req.user && req.user.roles[0] === constants.ROLE.ADMIN);

    // Check email exists;
    const email_lower = trimAndLowercase(dataAccount.email);
    const user = await User.findOne({ email_lower, deleted: false }).lean();
    if (user) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }

    const isExistNumber = await User.findOne({ number: dataAccount.number, roles: [constants.ROLE.MUNIC_ADMIN, constants.ROLE.MUNIC_MEMBER], deleted: false }).lean();
    if (isExistNumber) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'municipalities.form.number.error.exists') });
    }

    let munic = new Municipality(dataMunic);
    let account = new User(dataAccount);
    session = await mongoose.startSession();
    session.startTransaction();

    munic = await munic.save({ session });

    // set municipality
    account.municipality = munic._id;

    account = await account.save({ session });

    // update municipality
    await Municipality.updateOne({ _id: munic._id }, { admin: account._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    // Send mail
    try {
      if (isAdminCreate) {
        // send mail to munic account just created
        mailerServerUtil.sendMailAdminCreateCompanyMunic(dataAccount.email, dataAccount.password, dataAccount.first_name, dataAccount.last_name, munic.name, req.user.email);

        // admin create munic: also send mail to admin
        mailerServerUtil.sendMailAdminCreateMunicToAdmin(req.user.email, dataAccount.email);
      } else {
        mailerServerUtil.sendMailCreateCompanyOrMunic(dataAccount.email, dataAccount.password, dataAccount.first_name, dataAccount.last_name);
      }
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
    // var query = getQuery(condition);
    // var sort = help.getSort(condition);

    var options = { page: page, limit: limit };

    const aggregates = getQueryAggregate(condition);
    let result = await Municipality.aggregatePaginate(Municipality.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);


    // Municipality.paginate(query, {
    //   sort: sort,
    //   page: page,
    //   limit: limit,
    //   collation: { locale: 'ja' }
    // }).then(function (result) {
    //   return res.json(result);
    // });

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
      prefecture: data.prefecture,
      // fax: data.fax,
      methods: data.methods,
      bank_code: data.bank_code,
      bank_name: data.bank_name,
      branch_code: data.branch_code,
      branch_name: data.branch_name,
      bank_type: data.bank_type,
      bank_number: data.bank_number,
      bank_owner: data.bank_owner,
      bank_owner_kana: data.bank_owner_kana,
      fee: data.fee
    };

    const dataAccountUpdate = {
      first_name: data.admin.first_name,
      last_name: data.admin.last_name,
      name: data.admin.last_name + ' ' + data.admin.first_name,
      // email: data.admin.email,
      phone: data.admin.phone,
      department: data.admin.department
    };

    // if (data.password && data.password !== '') {
    //   dataAccountUpdate.password = data.password;
    // }

    let account = await User.findOne({ deleted: false, _id: req.model.admin });

    if (!account) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    // Check email exists;
    // const email_lower = trimAndLowercase(dataAccountUpdate.email);
    // const user = await User.findOne({ email_lower, deleted: false, _id: { $ne: account._id } }).lean();
    // if (user) {
    //   return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    // }

    session = await mongoose.startSession();
    session.startTransaction();

    await Municipality.updateOne({ _id: req.model._id }, dataUpdate);

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


    let isExitstEvent = await Event.findOne({ municipality: munic._id, deleted: false, status: { $in: [constants.EVENT_STATUS.PREPARING, constants.EVENT_STATUS.OPENING] } }).lean();
    if (isExitstEvent) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'municipalities.list.controller.message.event_exists') });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    // 1: Remove all munic member and munic admin
    await User.updateMany({ municipality: munic._id, deleted: false }, { $set: { deleted: true } }).session(session);

    // 2: Remove all using
    await Using.updateMany({ municipality: munic._id, deleted: false }, { $set: { deleted: true } }).session(session);

    // 3: Remove all product
    await Product.updateMany({ municipality: munic._id, deleted: false }, { $set: { deleted: true } }).session(session);

    // 4: Remove project of munic
    await Project.updateMany({ municipality: munic._id, deleted: false }, { $set: { deleted: true } }).session(session);

    // 5: Change expire of points
    await Point.updateMany({ municipality: munic._id, deleted: false }, { expire: moment() }).session(session);

    // 7: Delete munic info
    await Municipality.updateOne({ _id: munic._id, deleted: false }, { deleted: true }).session(session);

    await session.commitTransaction();
    session.endSession();

    try {
      check_point_expire.execute();
    } catch (error) {
      logger.error(error);
    }

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
      // let result = await help.checkPermission('delete_project', 'municipality', project.municipality);

      // if (result.perrmision_error) {
      //   return res.status(422).json(result);
      // }
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

    if (help.isAdminOrSubAdmin(req.user.roles)) {
      let result = await help.checkPermission(body.key, 'municipality', body.municipalityId);

      // Add req.body.requestItemId in case munic rollback permission and admin update existing request items
      if (!req.body.requestItemId && result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (req.body.requestItemId || result.is_need_authorize) {
        // Check request update is exists
        let isExistsRequest = await RequestItem.findOne({
          type: body.key,
          municipality: body.municipalityId,
          status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] },
          deleted: false
        });

        if (isExistsRequest && !req.body.requestItemId) {
          return res.status(422).send({ message: help.getMsLoc(lang, 'request_registration.server.error.request_update_munic_info_15_existing') });
        }

        let data = bankUpdate;

        let dataChanged = {};

        let munic = await Municipality.findById(body.municipalityId).lean();

        _.forEach(Object.keys(bankUpdate), (key) => {
          let value1 = munic[key];
          let value2 = bankUpdate[key];

          if (_.isArray(value2)) {
            if (!_.isArray(value1)) {
              value1 = [];
            }

            // Compare methods
            if (arrayEquals(value2, value1)) {
              value1 = true;
              value2 = true;
            } else {
              value1 = false;
              value2 = true;
            }
          }

          if (value1) {
            value1 = value1.toString();
          }
          if (value2) {
            value2 = value2.toString();
          }

          if (value1 !== value2 && key !== 'created') {
            dataChanged[key] = data[key];
          }

        });

        if (req.body.requestItemId) {
          await RequestItem.updateOne(
            { _id: req.body.requestItemId },
            { $set: { data: data } }
          );
        } else {
          let dataRequestItem = {
            municipality: body.municipalityId,
            data: dataChanged,
            type: body.key
          };

          let requestItem = new RequestItem(dataRequestItem);
          await requestItem.save();
        }

        return res.json(true);
      } else {
        const munic = await Municipality.updateOne({ _id: body.municipalityId }, bankUpdate);

        return res.json(munic);
      }
    } else {
      const munic = await Municipality.updateOne({ _id: auth.municipality }, bankUpdate);

      return res.json(munic);
    }

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

exports.listHasProjectsInPeriod = async function (req, res) {
  try {
    let condition = req.query || {};
    const companyId = req.user.company || condition.companyId;
    const isHasEventInPeriod = await eventsHelper.isHasEventInPeriod(condition.start, condition.end, companyId);
    if (isHasEventInPeriod) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'event.project_apply.form.server.error.start_end_selected_unavailable') });
    }

    const page = condition.page || 1;
    const limit = help.getLimit(condition);
    const options = { page: page, limit: limit };
    const aggregates = getQueryAggregateForListHasProjectsInPeriod(condition);
    let result = await Municipality.aggregatePaginate(Municipality.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
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

    if (help.isAdminOrSubAdmin(req.user.roles)) {
      let result = await help.checkPermission(body.key, 'municipality', municipality);

      // Add req.body.requestItemId in case munic rollback permission and admin update existing request items
      if (!req.body.requestItemId && result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (req.body.requestItemId || result.is_need_authorize) {
        // Check request update is exists
        let isExistsRequest = await RequestItem.findOne({
          type: body.key,
          municipality: municipality,
          status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] },
          deleted: false
        });

        if (isExistsRequest && !req.body.requestItemId) {
          if (body.key === FEATURE_MUNICIPALITY.UPDATE_TAX_PAYMENT_13) {
            return res.status(422).send({ message: help.getMsLoc(lang, 'request_registration.server.error.request_update_tax_payment_13_existing') });
          } else {
            return res.status(422).send({ message: help.getMsLoc(lang, 'request_registration.server.error.request_update_tax_payment_14_existing') });
          }
        }

        let munic = await Municipality.findById(municipality);

        let data = updateData;
        let dataChanged = {};
        if (body.key === FEATURE_MUNICIPALITY.UPDATE_TAX_PAYMENT_14) {
          data = {
            contact_name: data.contact_name,
            contact_tel: data.contact_tel,
            contact_mail: data.contact_mail,
            fax: data.fax
          };
        }

        if (body.key === FEATURE_MUNICIPALITY.UPDATE_TAX_PAYMENT_13) {
          delete data.contact_name;
          delete data.contact_tel;
          delete data.contact_name;
          delete data.contact_mail;
          delete data.fax;
          delete data.key;
          delete data.municipalityId;
        }

        _.forEach(Object.keys(data), (key) => {
          let value1 = munic[key];
          let value2 = data[key];

          if (value1) {
            value1 = value1.toString();
          }
          if (value2) {
            value2 = value2.toString();
          }

          if (value1 !== value2 && key !== 'created') {
            dataChanged[key] = data[key];
          }
        });

        let dataRequestItem = {
          municipality: municipality,
          data: dataChanged,
          type: body.key
        };

        if (req.body.requestItemId) {
          await RequestItem.updateOne(
            { _id: req.body.requestItemId },
            { $set: { data: data } }
          );
        } else {
          let requestItem = new RequestItem(dataRequestItem);
          await requestItem.save();
        }

        return res.json(true);
      } else {
        const munic = await Municipality.updateOne({ _id: municipality }, updateData);

        return res.json(munic);
      }
    } else {
      const munic = await Municipality.updateOne({ _id: municipality }, updateData);
      return res.json(munic);
    }
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

  if (condition.kind && condition.kind !== '') {
    and_arr.push({ kind: { $eq: Number(condition.kind) } });
  }

  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  if (condition.prefecture) {
    and_arr.push({ prefecture: { $eq: String(condition.prefecture) } });
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
    // second_and_arr.push({ code: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
    second_and_arr.push({ number: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
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

function getQueryAggregateForListHasProjectsInPeriod(condition) {
  let and_arr = [{
    deleted: false,
    $or: [
      { is_testing: null },
      { is_testing: false }
    ]
  }];
  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'projects',
      let: { municipality_id: '$_id' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$municipality', '$$municipality_id'] },
              { $lt: ['$start', new Date(condition.start)] },
              { $gt: ['$end', new Date(condition.end)] },
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
      as: 'projectsGroup'
    }
  }, {
    $unwind: {
      path: '$projectsGroup',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      numberOfProjects: { $cond: ['$projectsGroup', '$projectsGroup.total', 0] }
    }
  }, {
    $match: {
      numberOfProjects: { $gt: 0 }
    }
  });

  aggregates.push({
    $project: {
      projectsGroup: 0
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

function arrayEquals(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
}
