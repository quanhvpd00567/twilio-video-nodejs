'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  Project = mongoose.model('Project'),
  Municipality = mongoose.model('Municipality'),
  Event = mongoose.model('Event'),
  Comproject = mongoose.model('Comproject'),
  Request = mongoose.model('Request'),
  RequestItem = mongoose.model('RequestItem'),
  Config = mongoose.model('Config'),
  ConfigSet = mongoose.model('ConfigSet'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  _ = require('lodash'),
  moment = require('moment-timezone'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  FEATURE_MUNICIPALITY = require(path.resolve('./config/lib/master-data')).masterdata.FEATURE_MUNICIPALITY,
  imageController = require(path.resolve('./modules/core/server/controllers/image.server.controller'));

mongoose.Promise = require('bluebird');
const lang = 'ja';

exports.getProjects = async function (req, res) {
  try {
    const municipalityId = req.params && req.params.municipalityId;
    const { projectIds, eventStart } = req.body;
    if (!municipalityId || !projectIds || projectIds.length === 0) {
      return res.json({});
    }

    let condition = { deleted: false, municipality: municipalityId, _id: { $in: projectIds } };
    const [result, config, municipality, nearestConfigSetAps, nearestConfigSetPps] = await Promise.all([
      Project.find(condition).lean(),
      Config.findOne({}).select('-app').lean(),
      Municipality.findOne({ _id: municipalityId }).lean(),
      ConfigSet.findOne({
        deleted: false, type: constants.CONFIG_SET_TYPE.APS,
        is_applied: false,
        donation_amount_apply_start_date: { $lte: moment(eventStart) }
      }).sort('-donation_amount_apply_start_date').lean(),
      ConfigSet.findOne({
        deleted: false, type: constants.CONFIG_SET_TYPE.PPS,
        is_applied: false,
        pps_apply_start_date: { $lte: moment(eventStart) }
      }).sort('-pps_apply_start_date').lean()
    ]);

    if (nearestConfigSetAps) {
      config.aps = nearestConfigSetAps.aps;
      config.minimum_donation_amount = nearestConfigSetAps.minimum_donation_amount;
    }
    if (nearestConfigSetPps) {
      config.pps = nearestConfigSetPps.pps;
    }

    return res.json({ projects: result, config, municipality });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.paging = async function (req, res) {
  try {
    let municipality = '';
    let condition = req.body.condition || {};
    if (req.user.roles[0] === constants.ROLE.ADMIN || req.user.roles[0] === constants.ROLE.SUB_ADMIN) {
      municipality = condition.municipalityId;
    } else {
      municipality = req.user.municipality;
    }


    // const municipality = req.user.municipality;

    condition.municipality = municipality;

    const page = condition.page || 1;
    const limit = help.getLimit(condition);
    const options = { page: page, limit: limit };
    const aggregates = getQueryAggregate(condition);

    let result = await Project.aggregatePaginate(Project.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

// un join projects
exports.pagingProjectsOfMunicipality = async function (req, res) {
  try {
    const municipalityId = req.params && req.params.municipalityId;
    const companyId = req.body.condition.companyId || req.user.company;
    if (!companyId || !municipalityId) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
    }

    const condition = req.body.condition || {};
    const page = condition.page || 1;
    const limit = help.getLimit(condition);
    const options = { page: page, limit: limit };
    const aggregates = getQueryAggregateForPagingProjectsOfMunicipality(condition, companyId, municipalityId);
    let result = await Project.aggregatePaginate(Project.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

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

    // const today = new Date();
    // if (new Date(data.start) < today) {
    //   return res.status(422).send({ message: help.getMsLoc(lang, 'project.form.server.error.start_less_today') });
    // }

    const code = await help.getRandomCode(6, 'project');
    data.code = code;
    data.municipality = municipalityId;

    // Set seconds to 0
    data.start = new Date(data.start).setSeconds(0, 0);
    data.end = new Date(data.end).setSeconds(0, 0);

    let project = new Project(data);

    if (help.isAdminOrSubAdmin(req.user.roles)) {
      let result = await help.checkPermission(FEATURE_MUNICIPALITY.CREATE_PROJECT, 'municipality', data.municipality);

      // Add req.body.requestItemId in case munic rollback permission and admin update existing request items
      if (!req.body.requestItemId && result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (req.body.requestItemId || result.is_need_authorize) {
        delete data.municipalityId;

        if (req.body.requestItemId) {
          await RequestItem.updateOne(
            { _id: req.body.requestItemId },
            { $set: { data: project } }
          );
        } else {
          let dataRequestItem = {
            municipality: data.municipality,
            data: project,
            type: FEATURE_MUNICIPALITY.CREATE_PROJECT
          };

          let requestItem = new RequestItem(dataRequestItem);
          await requestItem.save();
        }

        return res.json(true);
      } else {
        await project.save();

        return res.json(project);
      }
    } else {
      await project.save();

      return res.json(project);
    }
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.uploadImage = function (req, res) {
  var imgConfig = config.uploads.projects.image;
  imageController.uploadImageCustomPath(imgConfig, 'image', req, res)
    .then(function (imageUrl) {
      res.json(imageUrl);
    })
    .catch(function (err) {
      logger.error(err);
      return res.status(422).send({ message: 'サーバーでエラーが発生しました。' });
    });
};

exports.read = function (req, res) {
  res.json(req.model);
};

exports.countNumberOfComprojects = async function (req, res) {
  try {
    const projectId = req.params.projectId;
    const result = await Comproject.countDocuments({ deleted: false, project: projectId });
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.update = async function (req, res) {
  try {
    let project = req.model;
    // Can not update start + end if numberOfComprojects > 0
    const numberOfComprojects = await Comproject.countDocuments({ deleted: false, project: project._id });
    if (numberOfComprojects > 0) {
      delete req.body.start;
      delete req.body.end;
    }

    if (help.isAdminOrSubAdmin(req.user.roles)) {
      let result = await help.checkPermission(FEATURE_MUNICIPALITY.UPDATE_PROJECT, 'municipality', project.municipality);

      // Add req.body.requestItemId in case munic rollback permission and admin update existing request items
      if (!req.body.requestItemId && result.perrmision_error) {
        return res.status(422).json(result);
      }

      // Check exists request update project
      if (req.body.requestItemId || result.is_need_authorize) {
        // Check request update is exists
        let isExistsRequest = await RequestItem.findOne({
          type: { $in: [FEATURE_MUNICIPALITY.UPDATE_PROJECT, FEATURE_MUNICIPALITY.DELETE_PROJECT] },
          municipality: req.model.municipality,
          status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] },
          project: req.model._id,
          deleted: false
        });

        if (isExistsRequest && !req.body.requestItemId) {
          return res.status(422).send({ message: help.getMsLoc(lang, 'request_registration.server.error.request_update_delete_project_existing') });
        }

        let dataChanged = {};
        _.forEach(Object.keys(req.body), (key) => {
          let value1 = project[key];
          let value2 = req.body[key];

          if (key === 'start' || key === 'end') {
            value1 = moment(value1);
            if (value1.isValid()) {
              value2 = moment(value2);
            }
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
          await RequestItem.updateOne(
            { _id: req.body.requestItemId },
            { $set: { data: dataChanged } }
          );
        } else {
          let dataRequestItem = {
            municipality: req.model.municipality,
            data: dataChanged,
            type: FEATURE_MUNICIPALITY.UPDATE_PROJECT,
            project: project._id
          };

          let requestItem = new RequestItem(dataRequestItem);
          await requestItem.save();
        }

        return res.json(true);
      } else {
        project = _.extend(project, req.body);
        await project.save();
        return res.json(project);
      }
    } else {
      project = _.extend(project, req.body);
      await project.save();
      return res.json(project);
    }
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  let session = null;
  try {
    let project = await Project.findById(req.model._id);

    project.deleted = true;

    if (req.user.roles[0] === constants.ROLE.ADMIN || req.user.roles[0] === constants.ROLE.SUB_ADMIN) {
      let result = await help.checkPermission(FEATURE_MUNICIPALITY.DELETE_PROJECT, 'municipality', project.municipality);

      if (result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (result.is_need_authorize) {
        // Check request update is exists
        let isExistsRequest = await RequestItem.findOne({
          type: { $in: [FEATURE_MUNICIPALITY.UPDATE_PROJECT, FEATURE_MUNICIPALITY.DELETE_PROJECT] },
          municipality: req.model.municipality,
          status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] },
          project: req.model._id,
          deleted: false
        });

        if (isExistsRequest) {
          return res.status(422).send({ message: help.getMsLoc(lang, 'request_registration.server.error.request_update_delete_project_existing') });
        }

        let dataRequestItem = {
          municipality: req.model.municipality,
          data: {},
          type: FEATURE_MUNICIPALITY.DELETE_PROJECT,
          project: project._id
        };

        let requestItem = new RequestItem(dataRequestItem);
        await requestItem.save();

        return res.json(true);
      } else {
        await project.save();

        return res.json(true);
      }
    } else {
      session = await mongoose.startSession();
      session.startTransaction();
      // Get request item
      let requestItem = await RequestItem.findOne({
        deleted: false, project: project._id,
        status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] }
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

      // Remove project
      await project.save({ session });

      await session.commitTransaction();
      session.endSession();

      try {
        help.emitNumberOfPendingRequests(project.municipality);
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

exports.projectIdByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  Project.findById(id)
    .exec(function (err, project) {
      if (err) {
        logger.error(err);
        return next(err);
      }
      //  else if (!project) {
      //   return next(new Error('お知らせが見つかりません。'));
      // }

      req.model = project;
      next();
    });
};

/** ====== PRIVATE ========= */
function getQuery(condition) {
  var and_arr = [{ deleted: false, municipality: condition.municipality }];
  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { code: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
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

  return { $and: and_arr };
}

function getQueryAggregate(condition) {
  let and_arr = [{ deleted: false, municipality: new ObjectId(condition.municipality) }];

  if (condition.keyword && condition.keyword !== '') {
    const or_arr = [
      // { code: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.start_min) {
    and_arr.push({ start: { $gte: new Date(condition.start_min) } });
  }
  if (condition.start_max) {
    and_arr.push({ start: { $lte: new Date(condition.start_max) } });
  }

  if (condition.end_min) {
    and_arr.push({ end: { $gte: new Date(condition.end_min) } });
  }
  if (condition.end_max) {
    and_arr.push({ end: { $lte: new Date(condition.end_max) } });
  }

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'comprojects',
      let: { project_id: '$_id' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$project', '$$project_id'] },
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
      as: 'countComproject'
    }
  }, {
    $unwind: {
      path: '$countComproject',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      numberOfComprojects: {
        $cond: ['$countComproject', '$countComproject.total', 0]
      }
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

function getQueryAggregateForPagingProjectsOfMunicipality(condition, companyId, municipalityId) {
  let and_arr = [{ deleted: false, municipality: new ObjectId(municipalityId), end: { $gte: new Date() } }];

  if (condition.keyword && condition.keyword !== '') {
    const or_arr = [
      { code: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.start) {
    and_arr.push({ start: { $lte: new Date(condition.start) } });
  }
  if (condition.end) {
    and_arr.push({ end: { $gte: new Date(condition.end) } });
  }

  if (condition.start_min) {
    and_arr.push({ start: { $gte: new Date(condition.start_min) } });
  }
  if (condition.start_max) {
    and_arr.push({ start: { $lte: new Date(condition.start_max) } });
  }

  if (condition.end_min) {
    and_arr.push({ end: { $gte: new Date(condition.end_min) } });
  }
  if (condition.end_max) {
    and_arr.push({ end: { $lte: new Date(condition.end_max) } });
  }

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'events',
      let: { project_id: '$_id', company_id: companyId },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$company', '$$company_id'] },
              { $eq: ['$project', '$$project_id'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }],
      as: 'event'
    }
  }, {
    $unwind: {
      path: '$event',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $match: { event: { $eq: null } }
  });

  const sort = help.getSortAggregate(condition);
  if (sort) {
    aggregates.push({
      $sort: sort
    });
  }

  return aggregates;
}
