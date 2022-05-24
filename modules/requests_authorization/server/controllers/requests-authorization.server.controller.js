'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Request = mongoose.model('Request'),
  RequestItem = mongoose.model('RequestItem'),
  Project = mongoose.model('Project'),
  Product = mongoose.model('Product'),
  Using = mongoose.model('Using'),
  Municipality = mongoose.model('Municipality'),
  User = mongoose.model('User'),
  Comproject = mongoose.model('Comproject'),
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  master_data = require(path.resolve('./config/lib/master-data')).masterdata,
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

const lang = 'ja';

exports.paging = async function (req, res) {
  try {
    const municipality = req.user.municipality;
    if (!municipality) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
    }

    let condition = req.body.condition || {};
    condition.municipality = municipality;

    var page = condition.page || 1;
    var query = getQuery(condition);
    var sort = help.getSort(condition);
    var limit = help.getLimit(condition);
    const options = {
      sort: sort,
      page: page,
      limit: limit,
      collation: { locale: 'ja' },
      populate: [
        { path: 'municipality', select: 'name prefecture' },
        {
          path: 'request_items',
          populate: [
            { path: 'product', select: 'name' },
            { path: 'user', select: 'first_name last_name name' },
            { path: 'project', select: 'name' },
            { path: 'using', select: 'name' }
          ]
        }
      ]
    };
    const result = await Request.paginate(query, options);
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.reject = async function (req, res) {
  try {
    const requestId = req.params.requestId;
    let { rejectReason } = req.body;
    if (!requestId || !rejectReason) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    let request = await Request.findOne({ _id: requestId, deleted: false, status: constants.REQUEST_STATUS.PENDING });
    if (!request) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'request_authorization.reject_request.server.error.request_not_found') });
    }

    request.status = constants.REQUEST_STATUS.REJECTED;
    request.rejected_reason = rejectReason;
    await request.save();

    help.emitNumberOfPendingRequests(request.municipality);
    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.approve = async function (req, res) {
  let session = null;
  try {
    const requestId = req.params.requestId;
    if (!requestId) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    let request = await Request.findOne({ _id: requestId, deleted: false, status: constants.REQUEST_STATUS.PENDING })
      .populate({
        path: 'request_items'
      });
    if (!request) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'request_authorization.reject_request.server.error.request_not_found') });
    }

    // 1. change request.status = APPROVED
    // 2. change requestItems.status = CLOSE
    // 3. CRUD data
    request.status = constants.REQUEST_STATUS.APPROVED;

    session = await mongoose.startSession();
    session.startTransaction();

    await request.save({ session });

    const requestItemIds = request.request_items.map(item => item._id);
    await RequestItem.updateMany({ deleted: false, _id: { $in: requestItemIds } }, { status: constants.REQUEST_ITEM_STATUS.CLOSED }, { session });

    const FEATURE_MUNICIPALITY = master_data.FEATURE_MUNICIPALITY;
    switch (request.type) {
      // project
      case FEATURE_MUNICIPALITY.CREATE_PROJECT: {
        const projectObjects = request.request_items.map(item => {
          if (item.data && item.data._id) {
            delete item.data._id;
          }
          return item.data;
        });
        await Project.insertMany(projectObjects, { session });
        break;
      }
      case FEATURE_MUNICIPALITY.UPDATE_PROJECT: {
        for (const requestItem of request.request_items) {
          if (requestItem.project) {
            await Project.updateOne({ _id: requestItem.project }, requestItem.data, { session });
          }
        }
        break;
      }
      case FEATURE_MUNICIPALITY.DELETE_PROJECT: {
        const projectIds = request.request_items.map(item => item.project);

        // Can not delete project applied by event
        const comprojects = await Comproject.find({ project: { $in: projectIds } }).populate({ path: 'project', select: 'name' });
        if (comprojects.length > 0) {
          let message = help.getMsLoc(lang, 'request_authorization.server.error.delete_project_applied');
          message = message.replace('{0}', comprojects[0].project.name);
          abortTransaction();
          return res.status(422).send({ message });
        }
        await Project.updateMany({ _id: { $in: projectIds } }, { deleted: true }, { session });
        break;
      }

      // product
      case FEATURE_MUNICIPALITY.CREATE_PRODUCT: {
        const productObjects = request.request_items.map(item => {
          if (item.data && item.data._id) {
            delete item.data._id;
          }
          return item.data;
        });
        await Product.insertMany(productObjects, { session });
        break;
      }
      case FEATURE_MUNICIPALITY.UPDATE_PRODUCT: {
        for (const requestItem of request.request_items) {
          if (requestItem.product) {
            await Product.updateOne({ _id: requestItem.product }, requestItem.data, { session });
          }
        }
        break;
      }
      // case FEATURE_MUNICIPALITY.DELETE_PRODUCT: {
      //   const productIds = request.request_items.map(item => item.product);
      //   await Product.updateMany({ _id: { $in: productIds }, deleted: true }, { session });
      //   break;
      // }

      // using
      // case FEATURE_MUNICIPALITY.CREATE_USING: {
      //   const usingObjects = request.request_items.map(item => {
      //     if (item.data && item.data._id) {
      //       delete item.data._id;
      //     }
      //     return item.data;
      //   });
      //   await Using.insertMany(usingObjects, { session });
      //   break;
      // }
      // case FEATURE_MUNICIPALITY.UPDATE_USING: {
      //   for (const requestItem of request.request_items) {
      //     if (requestItem.using) {
      //       await Using.updateOne(requestItem.using, requestItem.data, { session });
      //     }
      //   }
      //   break;
      // }
      // case FEATURE_MUNICIPALITY.DELETE_USING: {
      //   const usingIds = request.request_items.map(item => item.using);
      //   await Using.updateMany({ _id: { $in: usingIds }, deleted: true }, { session });
      //   break;
      // }

      // munic member
      // case FEATURE_MUNICIPALITY.CREATE_MUNIC_MEMBER: {
      //   let userObjects = request.request_items.map(item => {
      //     if (item.data && item.data._id) {
      //       delete item.data._id;
      //     }
      //     return item.data;
      //   });
      //   for (let user of userObjects) {
      //     user = new User(user);
      //     await user.save({ session });
      //   }
      //   // TODO: check send mail
      //   break;
      // }
      // case FEATURE_MUNICIPALITY.UPDATE_MUNIC_MEMBER: {
      //   for (const requestItem of request.request_items) {
      //     if (requestItem.user) {
      //       let user = await User.findOne(requestItem.user);
      //       if (user) {
      //         user = _.extend(user, requestItem.data);
      //         await user.save({ session });
      //       }
      //     }
      //   }
      //   break;
      // }
      // case FEATURE_MUNICIPALITY.DELETE_MUNIC_MEMBER: {
      //   // delete multiple: userId = requestItem.data
      //   // delete single: userId = requestItem.user
      //   let userIds = [];
      //   request.request_items.forEach(requestItem => {
      //     if (requestItem.data && requestItem.data.length > 0) {
      //       userIds = userIds.concat(requestItem.data);
      //     } else if (requestItem.user) {
      //       userIds = userIds.push(requestItem.user);
      //     }
      //   });
      //   await User.updateMany({ _id: { $in: userIds }, deleted: true }, { session });
      //   break;
      // }

      // munic info
      case FEATURE_MUNICIPALITY.UPDATE_TAX_PAYMENT_13:
      case FEATURE_MUNICIPALITY.UPDATE_TAX_PAYMENT_14:
      case FEATURE_MUNICIPALITY.UPDATE_MUNIC_INFO_15: {
        let municInfoChanged = {};
        for (const requestItem of request.request_items) {
          municInfoChanged = Object.assign(municInfoChanged, requestItem.data);
        }
        await Municipality.updateOne({ _id: request.municipality }, municInfoChanged, { session });
        break;
      }

      default:
        break;
    }

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

exports.delete = async function (req, res) {
  let session = null;
  try {
    const requestId = req.params.requestId;
    if (!requestId) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    let request = await Request.findOne({ _id: requestId, deleted: false, status: constants.REQUEST_STATUS.PENDING });
    if (!request) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'request_authorization.reject_request.server.error.request_not_found') });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    request.deleted = true;
    await request.save({ session });
    await RequestItem.updateMany({ _id: { $in: request.request_items } }, { deleted: true }, { session });

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

/** ====== PRIVATE ========= */
function getQuery(condition) {
  var and_arr = [{ deleted: false, municipality: condition.municipality, status: constants.REQUEST_STATUS.PENDING }];
  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { number: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.created_min) {
    and_arr.push({ created: { '$gte': condition.created_min } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { '$lte': condition.created_max } });
  }
  return { $and: and_arr };
}
