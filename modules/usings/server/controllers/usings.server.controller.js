'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Using = mongoose.model('Using'),
  RequestItem = mongoose.model('RequestItem'),
  Request = mongoose.model('Request'),
  path = require('path'),
  _ = require('lodash'),
  moment = require('moment'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  master_data = require(path.resolve('./config/lib/master-data')).masterdata,
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

mongoose.Promise = require('bluebird');
const lang = 'ja';

exports.paging = async function (req, res) {
  try {
    let municipality = req.user.municipality;
    let condition = req.body.condition || {};
    if (req.user.roles[0] === constants.ROLE.ADMIN || req.user.roles[0] === constants.ROLE.SUB_ADMIN) {
      municipality = condition.municipalityId;
    }

    condition.municipality = municipality;

    const page = condition.page || 1;
    const query = getQuery(condition);
    const sort = help.getSort(condition);
    const limit = help.getLimit(condition);

    const options = { sort, page, limit, collation: { locale: 'ja' } };
    const result = await Using.paginate(query, options);

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.create = async function (req, res) {
  try {
    let data = req.body;
    let municipalityId = '';
    if (help.isAdminOrSubAdmin(req.user.roles)) {
      municipalityId = data.municipalityId;
    } else {
      municipalityId = req.user.municipality;
    }

    if (!data || !municipalityId) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
    }

    // Set seconds to 0
    if (data.start) {
      data.start = new Date(data.start).setSeconds(0, 0);
    }
    if (data.end) {
      data.end = new Date(data.end).setSeconds(0, 0);
    }

    data.municipality = municipalityId;

    if (help.isAdminOrSubAdmin(req.user.roles)) {
      let result = await help.checkPermission(master_data.FEATURE_MUNICIPALITY.CREATE_USING, 'municipality', data.municipalityId);

      // Add req.body.requestItemId in case munic rollback permission and admin update existing request items
      if (!req.body.requestItemId && result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (req.body.requestItemId || result.is_need_authorize) {
        let municId = data.municipalityId;
        delete data.municipalityId;

        if (req.body.requestItemId) {
          await RequestItem.updateOne(
            { _id: req.body.requestItemId },
            { $set: { data: data } }
          );
        } else {
          let dataRequestItem = {
            municipality: municId,
            data: data,
            type: master_data.FEATURE_MUNICIPALITY.CREATE_USING
          };
          let requestItem = new RequestItem(dataRequestItem);
          await requestItem.save();
        }

        return res.json(true);
      } else {
        let using = new Using(data);
        await using.save();

        return res.json(using);
      }
    } else {
      // const today = new Date();
      // if (new Date(data.start) < today) {
      //   return res.status(422).send({ message: help.getMsLoc(lang, 'using.form.server.error.start_less_today') });
      // }


      let using = new Using(data);
      await using.save();

      return res.json(using);
    }
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
    let using = req.model;
    if (help.isAdminOrSubAdmin(req.user.roles)) {
      let result = await help.checkPermission(master_data.FEATURE_MUNICIPALITY.UPDATE_USING, 'municipality', req.body.municipalityId);

      if (result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (result.is_need_authorize) {
        // Check request update is exists
        let isExistsRequest = await RequestItem.findOne({
          type: master_data.FEATURE_MUNICIPALITY.UPDATE_USING,
          municipality: req.body.municipalityId,
          status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] },
          using: using._id,
          deleted: false
        });

        // Hung can not request any more
        if (isExistsRequest && !req.body.requestItemId) {
          return res.status(422).send({ message: 'アクセス権限が必要です。' });
        }

        let dataChanged = {};

        _.forEach(Object.keys(req.body), (key) => {
          let value1 = using[key];
          let value2 = req.body[key];
          console.log(key);

          if (key === 'start' || key === 'end') {
            value1 = moment(value1);
            if (value1.isValid()) {
              value2 = moment(value2);
            }
          }

          if (value1 && value2) {
            if (value1.toString() !== value2.toString() && key !== 'created') {
              dataChanged[key] = req.body[key];
            }
          }
        });
        if (req.body.requestItemId) {
          await RequestItem.updateOne(
            { _id: req.body.requestItemId },
            { $set: { data: dataChanged } }
          );
        } else {
          let dataRequestItem = {
            municipality: req.body.municipalityId,
            data: dataChanged,
            type: master_data.FEATURE_MUNICIPALITY.UPDATE_USING,
            using: using._id
          };
          let requestItem = new RequestItem(dataRequestItem);
          await requestItem.save();
        }

        return res.json(true);
      } else {
        using = _.extend(using, req.body);
        await using.save();

        return res.json(using);
      }

    } else {
      using = _.extend(using, req.body);
      await using.save();

      return res.json(using);
    }


  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  let session = null;
  try {

    if (help.isAdminOrSubAdmin(req.user.roles)) {
      let result = await help.checkPermission(master_data.FEATURE_MUNICIPALITY.DELETE_USING, 'municipality', req.model.municipality);
      if (result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (result.is_need_authorize) {
        // Check request update is exists
        let isExistsRequest = await RequestItem.findOne({
          type: master_data.FEATURE_MUNICIPALITY.DELETE_USING,
          municipality: req.model.municipality,
          status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] },
          using: req.model._id,
          deleted: false
        });

        // Hung: can not request any more
        if (isExistsRequest) {
          return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
        }

        let dataRequestItem = {
          municipality: req.model.municipality,
          data: {},
          type: master_data.FEATURE_MUNICIPALITY.DELETE_USING,
          using: req.model._id
        };

        let requestItem = new RequestItem(dataRequestItem);

        await requestItem.save();

        return res.json(true);
      } else {
        let using = await Using.findById(req.model._id);
        using.deleted = true;

        await using.save();
        return res.json(true);
      }

    } else {
      session = await mongoose.startSession();
      session.startTransaction();
      let using = await Using.findById(req.model._id);

      // Get request item
      let requestItem = await RequestItem.findOne({
        deleted: false, using: using._id
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

      // Remove using
      using.deleted = true;
      await using.save({ session });

      await session.commitTransaction();
      session.endSession();

      try {
        help.emitNumberOfPendingRequests(using.municipality);
      } catch (error) {
        logger.error(error);
      }

      return res.json(true);
    }
  } catch (error) {
    abortTransaction();
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }

  function abortTransaction() {
    if (session) {
      session.abortTransaction().then(() => {
        session.endSession();
      });
    }
  }
};

exports.usingIdByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  Using.findById(id)
    .exec(function (err, using) {
      if (err) {
        logger.error(err);
        return next(err);
      }
      // else if (!using) {
      //   return next(new Error('お知らせが見つかりません。'));
      // }

      req.model = using;
      next();
    });
};

/** ====== PRIVATE ========= */
function getQuery(condition) {
  var and_arr = [{ deleted: false, municipality: condition.municipality }];
  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.start_min) {
    and_arr.push({ start: { '$gte': condition.start_min } });
  }
  if (condition.start_max) {
    and_arr.push({ start: { '$lte': condition.start_max } });
  }

  if (condition.end_min) {
    and_arr.push({ end: { '$gte': condition.end_min } });
  }
  if (condition.end_max) {
    and_arr.push({ end: { '$lte': condition.end_max } });
  }

  if (condition.created_min) {
    and_arr.push({ created: { '$gte': condition.created_min } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { '$lte': condition.created_max } });
  }

  return { $and: and_arr };
}
