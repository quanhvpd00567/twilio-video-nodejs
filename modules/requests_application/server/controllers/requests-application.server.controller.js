'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  FeatureAuthorized = mongoose.model('FeatureAuthorized'),
  Municipality = mongoose.model('Municipality'),
  RequestItem = mongoose.model('RequestItem'),
  Request = mongoose.model('Request'),
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  masterdata = require(path.resolve('./config/lib/master-data')).masterdata,
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  moment = require('moment-timezone');
moment.locale('ja');

const lang = 'ja';

exports.list = async function (req, res) {
  try {
    const [municipality, requestsItem, requests] = await Promise.all([
      Municipality.find({ deleted: false }).sort({ _id: 1 }).select('_id name').lean(),
      RequestItem.find({ status: constants.REQUEST_STATUS.PENDING, deleted: false })
        .populate([
          { path: 'product', select: 'name' },
          { path: 'user', select: 'first_name last_name name' },
          { path: 'project', select: 'name' },
          { path: 'using', select: 'name' }
        ]),
      Request.find({
        $or: [{ status: constants.REQUEST_STATUS.PENDING }, { status: constants.REQUEST_STATUS.REJECTED }],
        deleted: false
      }).populate([
        {
          path: 'request_items', match: { deleted: false },
          populate: [
            { path: 'product', select: 'name' },
            { path: 'user', select: 'first_name last_name name' },
            { path: 'project', select: 'name' },
            { path: 'using', select: 'name' }
          ]
        },
        { path: 'municipality', select: 'prefecture name' }
      ])
    ]);

    const municipalityIds = municipality.map(function (i) { return i._id; });
    const authorizations = await FeatureAuthorized.find({ municipality: { $in: municipalityIds }, deleted: false });
    let requestsMunic = municipality.reduce(function (result, item, index) {
      const items = requestsItem.filter(function (i) {
        return i.municipality.toString() === item._id.toString();
      });

      const create_project = [];
      const update_project = [];
      const delete_project = [];

      const create_product = [];
      const update_product = [];
      const delete_product = [];

      const create_munic_member = [];
      const update_munic_member = [];
      const delete_munic_member = [];

      const create_using = [];
      const update_using = [];
      const delete_using = [];

      const update_tax_payment_13 = [];
      const update_tax_payment_14 = [];

      const update_munic_info_15 = [];

      items.forEach(function (i) {
        validateAuthorization(i, authorizations);
        switch (i.type) {
          case masterdata.FEATURE_MUNICIPALITY.CREATE_PROJECT:
            create_project.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.UPDATE_PROJECT:
            update_project.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.DELETE_PROJECT:
            delete_project.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.CREATE_PRODUCT:
            create_product.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.UPDATE_PRODUCT:
            update_product.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.DELETE_PRODUCT:
            delete_product.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.CREATE_MUNIC_MEMBER:
            create_munic_member.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.UPDATE_MUNIC_MEMBER:
            update_munic_member.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.DELETE_MUNIC_MEMBER:
            delete_munic_member.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.CREATE_USING:
            create_using.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.UPDATE_USING:
            update_using.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.DELETE_USING:
            delete_using.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.UPDATE_TAX_PAYMENT_13:
            update_tax_payment_13.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.UPDATE_TAX_PAYMENT_14:
            update_tax_payment_14.push(i);
            break;
          case masterdata.FEATURE_MUNICIPALITY.UPDATE_MUNIC_INFO_15:
            update_munic_info_15.push(i);
            break;
        }
      });

      item.groupTypes = [
        create_project,
        update_project,
        delete_project,
        create_product,
        update_product,
        delete_product,
        create_munic_member,
        update_munic_member,
        delete_munic_member,
        create_using,
        update_using,
        delete_using,
        update_tax_payment_13,
        update_tax_payment_14,
        update_munic_info_15
      ];

      result.push(item);
      return result;
    }, []);
    requestsMunic = requestsMunic.filter(function (i) {
      return i.groupTypes.some(function (i) { return i.length; });
    });
    requests.forEach(function (i) {
      validateAuthorization(i, authorizations);
    });
    const rejecteds = requests.filter(function (i) {
      return i.status === constants.REQUEST_STATUS.REJECTED;
    });
    const waitings = requests.filter(function (i) {
      return i.status === constants.REQUEST_STATUS.PENDING;
    });

    return res.json({ requests: requestsMunic, rejecteds, waitings });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.submit = async function (req, res) {
  try {
    const { municipality, type, requestItemIds } = req.body;

    if (!municipality || !type || !requestItemIds) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    const start = moment().startOf('day');
    const end = moment().endOf('day');
    const curDay = moment().format('YYYYMMDD');
    const index = await Request.countDocuments({ created: { $gte: start, $lte: end } });
    const number = padLeadingZeros(index + 1, 4);

    await RequestItem.updateMany(
      { _id: { $in: requestItemIds } },
      { $set: { status: constants.REQUEST_ITEM_STATUS.SUBMITTED } }
    );
    await Request.create({
      type,
      municipality,
      number: 'SO-' + curDay + '-' + number,
      request_items: requestItemIds,
      status: constants.REQUEST_STATUS.PENDING
    });

    help.emitNumberOfPendingRequests(municipality);
    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.resubmit = async function (req, res) {
  try {
    const { _id, reason } = req.body;

    if (!_id || !reason) {
      return res.status(422).send({ message: help.getMsLoc() });
    }
    const request = await Request.findOne({ _id: _id, deleted: false }).lean();
    if (!request) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'request_authorization.reject_request.server.error.request_not_found') });
    }
    let result = await help.checkPermission(request.type, 'municipality', request.municipality);
    if (result.perrmision_error || !result.is_need_authorize) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'request_application.server.error.no_permission') });
    }

    await Request.updateOne(
      { _id: _id },
      { $set: { status: constants.REQUEST_STATUS.PENDING, resubmitted_reason: reason } }
    );

    help.emitNumberOfPendingRequests(request.municipality);
    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.removeRequestItem = async function (req, res) {
  let session = null;
  try {
    const requestItemId = req.body._id;
    if (!requestItemId) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    let request = await Request.findOne({
      deleted: false, request_items: new ObjectId(requestItemId)
    });
    if (request) {
      if (request.request_items.length === 1) {
        // delete request
        request.deleted = true;
        await request.save({ session });
      } else {
        // remove request_item_id
        await Request.updateOne({ _id: request._id }, { $pull: { request_items: requestItemId } }, { session });
      }
    }

    await RequestItem.updateOne(
      { _id: req.body._id },
      { $set: { deleted: true } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    try {
      if (request) {
        help.emitNumberOfPendingRequests(request.municipality);
      }
    } catch (error) {
      logger.error(error);
    }

    return res.json(true);
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

exports.removeRequest = async function (req, res) {
  let session = null;
  try {
    let request = await Request.findById(req.body._id);
    if (!request) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'request_authorization.reject_request.server.error.request_not_found') });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const requestItemIds = request.request_items;
    await RequestItem.updateMany(
      { _id: { $in: requestItemIds } },
      { $set: { deleted: true } },
      { session }
    );

    request.deleted = true;
    await request.save();

    await session.commitTransaction();
    session.endSession();

    try {
      help.emitNumberOfPendingRequests(request.municipality);
    } catch (error) {
      logger.error(error);
    }

    return res.json(true);
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

exports.read = function (req, res) {
  return res.json(req.model);
};

exports.update = async function (req, res) {
  try {
    await RequestItem.updateOne(
      { _id: req.model._id },
      { $set: { data: req.body } }
    );

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getById = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  RequestItem.findById(id)
    .exec(function (err, result) {
      if (err) {
        logger.error(err);
        return res.status(400).send({
          message: 'お知らせが見つかりません。'
        });
      } else if (!result) {
        return res.status(400).send({
          message: 'お知らせが見つかりません。'
        });
      }

      req.model = result;
      next();
    });
};

function padLeadingZeros(num, size) {
  var s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}

function validateAuthorization(request, authorizations) {
  const isAuthorization = authorizations.find(function (i) {
    const hasFeature = i.features_authorized.find(item => item.feature === request.type);
    return i.municipality.toString() === request.municipality._id.toString() && hasFeature && hasFeature.is_need_authorize;
  });
  request._doc.isAuthorization = !!isAuthorization;
}
