'use strict';

const { assign } = require('underscore');

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  Company = mongoose.model('Company'),
  Request = mongoose.model('Request'),
  RequestItem = mongoose.model('RequestItem'),
  FeatureAuthorized = mongoose.model('FeatureAuthorized'),
  User = mongoose.model('User'),
  path = require('path'),
  _ = require('lodash'),
  mailerServerUtil = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  master_data = require(path.resolve('./config/lib/master-data')).masterdata,
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

const lang = 'ja';

exports.create = async function (req, res) {
  try {
    let data = req.body;
    const auth = req.user;

    if (!data) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    const pass = data.email.split('@')[0];
    let role = constants.ROLE.MUNIC_MEMBER;
    if (data.role === constants.ROLE.MUNIC_ADMIN) {
      role = constants.ROLE.MUNIC_ADMIN;
    }

    // Prepare data employee
    const dataMunicMember = {
      last_name: data.last_name,
      first_name: data.first_name,
      name: data.last_name + ' ' + data.first_name,
      email: data.email,
      password: pass,
      number: data.number,
      department: data.department,
      note: data.note,
      roles: role
    };

    if (help.isAdminOrSubAdmin(req.user.roles)) {
      dataMunicMember.municipality = data.municipalityId;
    } else {
      dataMunicMember.municipality = auth.municipality;
    }

    const email_lower = trimAndLowercase(data.email);
    // Check email is email munic admin
    if (auth.email === email_lower) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }

    // Check email exists;
    let conditionCheckEmailExisting = { email: email_lower, deleted: false };
    if (req.body.requestItemId) {
      conditionCheckEmailExisting._id = { $ne: req.body.requestItemId };
    }
    const [isExistingEmailInUser, isExistingEmailInRequestItem] = await Promise.all([
      User.findOne({ email_lower, deleted: false }).lean(),
      RequestItem.findOne(conditionCheckEmailExisting).lean()
    ]);
    if (isExistingEmailInUser || isExistingEmailInRequestItem) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }

    // Check employee no is unique
    let conditionCheckNumberExisting = { munic_member_number: data.number, municipality: dataMunicMember.municipality, deleted: false };
    if (req.body.requestItemId) {
      conditionCheckNumberExisting._id = { $ne: req.body.requestItemId };
    }
    const [isExistNumberInUser, isExistNumberInRequestItem] = await Promise.all([
      User.findOne({ number: data.number, municipality: dataMunicMember.municipality, deleted: false }).lean(),
      RequestItem.findOne(conditionCheckNumberExisting).lean()
    ]);
    if (isExistNumberInUser || isExistNumberInRequestItem) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'munic_members.form.number.error.exists') });
    }

    if (help.isAdminOrSubAdmin(req.user.roles)) {
      let result = await help.checkPermission(master_data.FEATURE_MUNICIPALITY.CREATE_MUNIC_MEMBER, 'municipality', data.municipalityId);

      // Add req.body.requestItemId in case munic rollback permission and admin update existing request items
      if (!req.body.requestItemId && result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (req.body.requestItemId || result.is_need_authorize) {
        if (req.body.requestItemId) {
          await RequestItem.updateOne(
            { _id: req.body.requestItemId },
            { $set: { data: dataMunicMember, munic_member_number: dataMunicMember.number, email: email_lower } }
          );
        } else {
          let dataRequestItem = {
            municipality: data.municipalityId,
            type: master_data.FEATURE_MUNICIPALITY.CREATE_MUNIC_MEMBER,
            data: dataMunicMember,
            email: dataMunicMember.email,
            munic_member_number: dataMunicMember.number
          };
          let requestItem = new RequestItem(dataRequestItem);
          await requestItem.save();
        }
      } else {
        let account = new User(dataMunicMember);

        account = await account.save();

        // Send mail
        mailerServerUtil.sendMailCreateMunicMember(email_lower, pass, account.first_name, account.last_name);
      }

      return res.json(true);

    } else {
      let account = new User(dataMunicMember);

      account = await account.save();

      // Send mail
      mailerServerUtil.sendMailCreateMunicMember(email_lower, pass, account.first_name, account.last_name);
      return res.json(true);
    }
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
    const auth = req.user;
    var condition = req.query || {};
    var page = condition.page || 1;
    var limit = help.getLimit(condition);
    var municId = auth.municipality;
    if (auth.roles[0] === constants.ROLE.ADMIN || auth.roles[0] === constants.ROLE.SUB_ADMIN) {
      municId = condition.municipalityId;
    }
    var query = getQuery(condition, municId);
    var sort = help.getSort(condition);
    User.paginate(query, {
      sort: sort,
      page: page,
      populate: {
        path: 'subsidiary',
        select: 'name'
      },
      limit: limit,
      collation: { locale: 'ja' }
    }).then(function (result) {
      return res.json(result);
    });

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

exports.isOnlyOneMunicAdmin = async function (req, res) {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.json(false);
    }

    const user = await User.findById(userId).select('roles municipality').lean();
    if (!user) {
      return res.json(false);
    }

    const numberOfMunicAdmins = await User.countDocuments({ deleted: false, roles: constants.ROLE.MUNIC_ADMIN, municipality: user.municipality });
    return res.json(numberOfMunicAdmins === 1);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.update = async function (req, res) {
  try {
    const auth = req.user;
    let member = req.model;
    let data = req.body;

    // Prepare data employee
    let role = constants.ROLE.MUNIC_MEMBER;
    if (data.role === constants.ROLE.MUNIC_ADMIN) {
      role = constants.ROLE.MUNIC_ADMIN;
    }

    const dataMunicMember = {
      last_name: data.last_name,
      first_name: data.first_name,
      name: data.last_name + ' ' + data.first_name,
      department: data.department,
      number: data.number,
      note: data.note,
      roles: [data.role]
    };


    const email_lower = trimAndLowercase(data.email);

    // if (data.role === constants.ROLE.MUNIC_MEMBER) {
    if (data.role === constants.ROLE.MUNIC_MEMBER && String(auth._id) === String(member._id)) {
      // check role
      const count = await User.countDocuments({ municipality: member.municipality, roles: constants.ROLE.MUNIC_ADMIN, deleted: false });
      if (count === 1) {
        return res.status(422).send({ message: help.getMsLoc(lang, 'munic_members.form.error.has_one_account_admin') });
      }
    }


    // // Check email is email company
    // if (auth.email === email_lower) {
    //   return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    // }

    // // Check email exists;
    // const user = await User.findOne({ email_lower, deleted: false, _id: { $ne: member._id } }).lean();
    // if (user) {
    //   return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    // }

    // Check admin member no is unique
    let conditionCheckNumberExisting = { munic_member_number: data.number, municipality: member.municipality, deleted: false };
    if (req.body.requestItemId) {
      conditionCheckNumberExisting._id = { $ne: req.body.requestItemId };
    }
    const [isExistNumberInUser, isExistNumberInRequestItem] = await Promise.all([
      User.findOne({ number: data.number, municipality: member.municipality, deleted: false, _id: { $ne: member._id } }).lean(),
      RequestItem.findOne(conditionCheckNumberExisting).lean()
    ]);
    if (isExistNumberInUser || isExistNumberInRequestItem) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'munic_members.form.number.error.exists') });
    }

    if (help.isAdminOrSubAdmin(req.user.roles)) {
      let result = await help.checkPermission(master_data.FEATURE_MUNICIPALITY.UPDATE_MUNIC_MEMBER, 'municipality', member.municipality);

      if (result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (result.is_need_authorize) {
        let isExists = await RequestItem.findOne({ type: master_data.FEATURE_MUNICIPALITY.UPDATE_MUNIC_MEMBER, user: member._id, municipality: member.municipality, status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] }, deleted: false });

        // Hung: can not request any more
        if (isExists && !req.body.requestItemId) {
          return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
        }
      }

      if (result.is_need_authorize) {
        let dataChanged = {};
        _.forEach(Object.keys(dataMunicMember), (key) => {
          let value1 = member[key];
          let value2 = dataMunicMember[key];

          if (_.isArray(value1) && _.isArray(value2)) {
            value1 = value1[0];
            value2 = value2[0];
          }

          if (value1) {
            value1 = value1.toString();
          }
          if (value2) {
            value2 = value2.toString();
          }

          if (value1 !== value2 && key !== 'created') {
            dataChanged[key] = req.body[key];
          }

        });
        if (req.body.requestItemId) {
          // No email becos can not update email
          await RequestItem.updateOne(
            { _id: req.body.requestItemId },
            { $set: { data: dataChanged, munic_member_number: dataChanged.number } }
          );
        } else {
          let dataRequestItem = {
            municipality: member.municipality,
            type: master_data.FEATURE_MUNICIPALITY.UPDATE_MUNIC_MEMBER,
            data: dataChanged,
            user: member._id,
            munic_member_number: dataMunicMember.number
          };

          let requestItem = new RequestItem(dataRequestItem);
          await requestItem.save();
        }

        return res.json(true);
      } else {
        member = _.extend(member, dataMunicMember);
        await member.save();
        return res.json(member);
      }
    } else {
      member = _.extend(member, dataMunicMember);
      await member.save();
      return res.json(member);
    }
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  let session = null;
  try {
    const member = req.model;
    const auth = req.user;
    let municipalityId = auth.municipality;
    if (help.isAdminOrSubAdmin(req.user.roles)) {
      municipalityId = member.municipality;

      let result = await help.checkPermission(master_data.FEATURE_MUNICIPALITY.DELETE_MUNIC_MEMBER, 'municipality', member.municipality);

      if (result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (result.is_need_authorize) {
        let isExists = await RequestItem.findOne({ type: master_data.FEATURE_MUNICIPALITY.DELETE_MUNIC_MEMBER, municipality: member.municipality, status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] }, deleted: false })
          .exec()
          .then(result => {
            if (result === null) {
              return false;
            }
            return result.data[0].toString() === member._id.toString();
          });

        // Hung: can not request any more
        if (isExists) {
          return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
        }

        let dataRequestItem = {
          municipality: member.municipality,
          type: master_data.FEATURE_MUNICIPALITY.DELETE_MUNIC_MEMBER,
          data: [member._id]
        };

        let requestItem = new RequestItem(dataRequestItem);

        await requestItem.save();

        return res.json(true);
      } else {
        await User.updateOne({ _id: member._id, municipality: municipalityId, deleted: false }, { deleted: true });

        return res.json(true);
      }
    } else {
      let municMember = await User.findById(req.model._id);
      session = await mongoose.startSession();
      session.startTransaction();
      // Get request item
      let requestItem = await RequestItem.findOne({
        deleted: false, munic_member_number: municMember._id
      }).lean();

      if (requestItem) {
        // Get request
        let request = await Request.findOne({
          deleted: false, request_items: requestItem._id
        });

        if (request) {
          if (request.request_items.length === 1) {
            // Remove request
            request.deleted = true;
            await request.save({ session });
          } else {
            // Remove request_item_id
            await Request.updateOne({ _id: request._id }, { $pull: { request_items: requestItem._id } }, { session });
          }
        }

        // Remove request item
        await RequestItem.updateOne(
          { _id: requestItem._id },
          { $set: { deleted: true } },
          { session }
        );
      }

      // Remove municipality member
      municMember.deleted = true;
      await municMember.save({ session });

      await session.commitTransaction();
      session.endSession();

      try {
        help.emitNumberOfPendingRequests(member.municipality);
      } catch (error) {
        logger.error(error);
      }

      return res.json(true);
    }
  } catch (error) {
    abortTransaction(session);
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.removeMulti = async function (req, res) {
  let session = null;
  try {
    const ids = req.body.ids;
    const auth = req.user;
    if (help.isAdminOrSubAdmin(req.user.roles)) {
      let municipalityId = req.body.municipalityId;
      let result = await help.checkPermission(master_data.FEATURE_MUNICIPALITY.DELETE_MUNIC_MEMBER, 'municipality', new mongoose.Types.ObjectId(municipalityId));

      if (result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (result.is_need_authorize) {
        let isExists = await RequestItem.findOne({
          type: master_data.FEATURE_MUNICIPALITY.DELETE_MUNIC_MEMBER,
          municipality: municipalityId,
          status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] },
          deleted: false
        })
          .exec()
          .then(result => {
            if (result === null) {
              return false;
            }

            let x = result.data.filter(item => ids.includes(item.toString()));

            return x.length > 0;
          });

        // Hung: can not request any more
        if (isExists) {
          return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
        }

        let dataRequestItem = {
          municipality: municipalityId,
          type: master_data.FEATURE_MUNICIPALITY.DELETE_MUNIC_MEMBER,
          data: ids
        };

        let requestItem = new RequestItem(dataRequestItem);

        await requestItem.save();

        return res.json(true);
      } else {

        await User.updateMany({ _id: { $in: ids }, deleted: false, municipality: municipalityId }, { deleted: true });

        return res.json(true);
      }

    } else {
      session = await mongoose.startSession();
      session.startTransaction();

      await _.forEach(ids, async (id) => {
        let municMember = await User.findById(id);

        // Get request item
        let requestItem = await RequestItem.findOne({
          deleted: false, munic_member_number: municMember._id
        }).lean();

        if (requestItem) {
          // Get request
          let request = await Request.findOne({
            deleted: false, request_items: requestItem._id
          });

          if (request) {
            if (request.request_items.length === 1) {
              // Remove request
              request.deleted = true;
              await request.save({ session });
            } else {
              // Remove request_item_id
              await Request.updateOne({ _id: request._id }, { $pull: { request_items: requestItem._id } }, { session });
            }
          }

          // Remove request item
          await RequestItem.updateOne(
            { _id: requestItem._id },
            { $set: { deleted: true } },
            { session }
          );
        }

        municMember.deleted = true;
        municMember.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.json(true);
      });

      return res.json(true);
    }
  } catch (error) {
    abortTransaction(session);
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.memberById = function (req, res, next, id) {
  const auth = req.user;
  let municipalityId = auth.municipality;
  let conditions = { _id: id, deleted: false, roles: { $in: [constants.ROLE.MUNIC_ADMIN, constants.ROLE.MUNIC_MEMBER] }, municipality: municipalityId };
  if ((auth.roles[0] === constants.ROLE.ADMIN || auth.roles[0] === constants.ROLE.SUB_ADMIN)) {
    delete conditions.municipality;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  User.findOne(conditions)
    .exec(function (err, event) {
      if (err) {
        logger.error(err);
        return next(err);
      } else if (!event) {
        return res.json({ is_notfound: true });
      }

      req.model = event;
      next();
    });
};

/** ====== PRIVATE ========= */
function getQuery(condition, municipality) {
  var and_arr = [{ deleted: false, roles: { $in: [constants.ROLE.MUNIC_ADMIN, constants.ROLE.MUNIC_MEMBER] }, municipality: municipality }];
  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { last_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { first_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { number: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { email: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.role && condition.role !== '') {
    and_arr.push({ roles: condition.role });
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

/**
 * Roll back
 *
 * @param {*} session
 */
function abortTransaction(session) {
  if (session) {
    session.abortTransaction().then(() => {
      session.endSession();
    });
  }
}
