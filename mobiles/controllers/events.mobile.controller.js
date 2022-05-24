'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  Comproject = mongoose.model('Comproject'),
  User = mongoose.model('User'),
  Event = mongoose.model('Event'),
  Participant = mongoose.model('Participant'),
  translate = require(path.resolve('./config/locales/mobile/ja.json')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  helper = require(path.resolve('./mobiles/controllers/help.mobile.controller')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  simulationServerController = require(path.resolve('./modules/core/server/controllers/simulation.server.controller')),
  rankServerController = require(path.resolve('./modules/core/server/controllers/rank.server.controller'));

exports.list = async function (req, res) {
  try {
    const { page } = req.body;
    const companyId = req.user.company;
    const userId = req.user._id;

    if (!companyId || !userId) {
      return res.status(422).send({ message: translate['user.account_not_found'] });
    }

    const limit = helper.getLimit(req.body);
    const options = { page: page || 1, limit: limit };

    const [eventOpening, eventPreparing] = await Promise.all([
      Event.findOne({ deleted: false, status: constants.EVENT_STATUS.OPENING, company: companyId }).sort({ start: 1 }).select('_id').lean(),
      Event.findOne({ deleted: false, status: constants.EVENT_STATUS.PREPARING, company: companyId }).sort({ start: 1 }).select('_id').lean()
    ]);

    let eventId = (eventOpening && eventOpening._id) || (eventPreparing && eventPreparing._id);
    if (!eventId) {
      return res.json(null);
    }
    const aggregates = getQueryAggregate(companyId, userId, eventId);
    let result = await Comproject.aggregatePaginate(Comproject.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = helper.parseAggregateQueryResult(result, page);
    if (result) {
      result.docs = result.docs.map(item => item.doc);
      result.docs = result.docs.map(item => {
        item.municipalityName = item.municipality && item.municipality.name;
        item.municipalityPrefecture = item.municipality && item.municipality.prefecture;
        delete item.municipality;

        item.numberOfJoinedEmployeesSameGroup = item.countParticipant && item.countParticipant.total || 0;
        delete item.countParticipant;

        return item;
      });
    }

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.list_others = async function (req, res) {
  try {
    const { page } = req.body;
    const companyId = req.user.company;
    const userId = req.user._id;

    if (!companyId || !userId) {
      return res.status(422).send({ message: translate['user.account_not_found'] });
    }

    const limit = helper.getLimit(req.body);
    const options = { page: page || 1, limit: limit };

    const [eventOpening, eventPreparing] = await Promise.all([
      Event.findOne({ deleted: false, status: constants.EVENT_STATUS.OPENING, company: companyId }).sort({ start: 1 }).select('_id').lean(),
      Event.findOne({ deleted: false, status: constants.EVENT_STATUS.PREPARING, company: companyId }).sort({ start: 1 }).select('_id').lean()
    ]);

    let eventId = (eventOpening && eventOpening._id) || (eventPreparing && eventPreparing._id);
    let comprojectId = null;
    if (!eventId) {
      comprojectId = await helper.getComprojectJoiningId(req.user);
      if (comprojectId) {
        const comproject = await Comproject.findById(comprojectId);
        eventId = comproject && comproject.event;
      }
    }
    if (!eventId) {
      return res.json(null);
    }

    const aggregates = getQueryAggregateNew(companyId, userId, eventId, comprojectId ? [constants.EVENT_STATUS.FINISHED] : null);
    let result = await Comproject.aggregatePaginate(Comproject.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = helper.parseAggregateQueryResult(result, page);
    if (result) {
      result.docs = result.docs.map(item => item.doc);
      var promises = [];
      result.docs = result.docs.forEach(async (item) => {
        promises.push(updateData(item, eventId));
      });
      var results = await Promise.all(promises);
      result.docs = results;
    }

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

async function updateData(item, eventId) {
  item.municipalityName = item.municipality && item.municipality.name;
  item.municipalityPrefecture = item.municipality && item.municipality.prefecture;
  delete item.municipality;

  item.numberOfJoinedEmployeesSameGroup = item.countParticipant && item.countParticipant.total || 0;
  delete item.countParticipant;

  if (item.status === constants.EVENT_STATUS.OPENING) {
    let participantsOfCompany = await Participant.find({ deleted: false, event: eventId });
    console.log(participantsOfCompany);
    const participantsOfCompanyOfComproject = participantsOfCompany.filter(participant => {
      return participant.comproject.toString() === item._id.toString();
    });
    console.log(participantsOfCompanyOfComproject);
    const totalAmount = participantsOfCompanyOfComproject.reduce((sum, item) => {
      return sum + item.amount;
    }, 0);

    item.total = totalAmount;
  }

  return item;
}

exports.detail = async function (req, res) {
  try {
    const eventId = req.body.eventId;
    if (!eventId) {
      return res.status(422).send({ message: translate['system.missing_params.error'] });
    }

    const condition = { deleted: false, _id: eventId };
    let event = await Comproject.findOne(condition)
      .populate([
        { path: 'project' },
        { path: 'municipality' }
      ]).lean();

    return res.json(event);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.join = async function (req, res) {
  let session = null;
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(422).send({ message: translate['system.missing_params.error'] });
    }

    if (req.user.comproject_joining) {
      return res.status(422).send({ message: translate['event.join.error.existed'] });
    }

    const userId = req.user._id;
    const condition = { deleted: false, _id: eventId };

    let comproject = await Comproject.findOne(condition)
      .populate({
        path: 'project'
      }).lean();

    if (!comproject || !comproject.project) {
      return res.status(422).send({ message: translate['event.crud.not_found'] });
    }
    // if (comproject.status === constants.EVENT_STATUS.PREPARING) {
    //   return res.status(422).send({ message: translate['event.join.error.not_opening'] });
    // }
    if (comproject.status === constants.EVENT_STATUS.FINISHED) {
      return res.status(422).send({ message: translate['event.join.error.finished'] });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    let participantObject = {
      user: userId,
      event: comproject.event,
      comproject: comproject._id,
      company: req.user.company,
      municipality: comproject.project.municipality
    };
    let participant = new Participant(participantObject);
    await participant.save({ session });
    await User.updateOne({ _id: userId }, { comproject_joining: comproject._id }, { session });

    await session.commitTransaction();
    session.endSession();

    // Calculate rank
    try {
      rankServerController.recalculateRanksForComproject(comproject._id, req.user.company);
    } catch (error) {
      logger.error(error);
    }

    return res.json(true);
  } catch (error) {
    abortTransaction();
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }

  function abortTransaction() {
    if (session) {
      session.abortTransaction().then(() => {
        session.endSession();
      });
    }
  }
};

exports.pagingHistories = async function (req, res) {
  try {
    const { page } = req.body;
    const companyId = req.user.company;
    const userId = req.user._id;

    if (!companyId || !userId) {
      return res.status(422).send({ message: translate['user.account_not_found'] });
    }

    const limit = helper.getLimit(req.body);
    const options = { page: page || 1, limit: limit };
    const aggregates = getQueryAggregateForHistoriesJoinedEvent(companyId, userId);
    let result = await Participant.aggregatePaginate(Participant.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = helper.parseAggregateQueryResult(result, page);
    result.docs = result.docs.map(item => {
      item.steps = simulationServerController.roundSteps(item.steps);
      return item;
    });

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.listComprojectsOfEvent = async function (req, res) {
  try {
    const comprojectId = await helper.getComprojectJoiningId(req.user);
    if (!comprojectId) {
      return res.status(422).send({ message: helper.getMsLoc('ja', 'system.server.error.permission') });
    }
    const companyId = req.user.company;
    if (!companyId) {
      return res.status(422).send({ message: translate['user.account_not_found'] });
    }

    const comproject = await Comproject.findById(comprojectId).select('event status').lean();
    if (!comproject) {
      return res.status(422).send({ message: translate['event.crud.not_found'] });
    }
    const aggregates = getQueryAggregateForListComprojects(comproject.event, companyId);
    let result = await Comproject.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' });
    result = JSON.parse(JSON.stringify(result));
    result = result.map(item => {
      if (item.project) {
        item.project.target_amount = item.totalAmounts;
      }

      if (comproject.status === constants.EVENT_STATUS.FINISHED) {
        item.totalAmounts = item.total;
      }
      return item;
    });

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};


function getQueryAggregate(companyId, userId, eventId) {
  let and_arr = [{ deleted: false, company: new ObjectId(companyId), event: new ObjectId(eventId), status: { $in: [constants.EVENT_STATUS.PREPARING, constants.EVENT_STATUS.OPENING] } }];
  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'participants',
      let: { comproject_id: '$_id', user_id: userId },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$user', '$$user_id'] },
              { $eq: ['$comproject', '$$comproject_id'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }],
      as: 'participant'
    }
  }, {
    $unwind: {
      path: '$participant',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $match: { participant: { $eq: null } }
  });

  aggregates.push({
    $lookup: {
      from: 'participants',
      let: { comproject_id: '$_id', company_id: companyId },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$comproject', '$$comproject_id'] },
              { $eq: ['$company', '$$company_id'] },
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
      as: 'countParticipant'
    }
  }, {
    $unwind: {
      path: '$countParticipant',
      preserveNullAndEmptyArrays: true
    }
  });

  aggregates.push({
    $lookup: {
      from: 'projects',
      localField: 'project',
      foreignField: '_id',
      as: 'project'
    }
  }, {
    $unwind: {
      path: '$project',
      preserveNullAndEmptyArrays: false
    }
  });

  aggregates.push({
    $lookup: {
      from: 'municipalities',
      localField: 'municipality',
      foreignField: '_id',
      as: 'municipality'
    }
  }, {
    $unwind: {
      path: '$municipality',
      preserveNullAndEmptyArrays: false
    }
  });

  aggregates.push({
    $group: {
      _id: '$project._id',
      doc: {
        '$first': '$$ROOT'
      }
    }
  });

  aggregates.push({
    $sort: { start: 1 }
  });

  return aggregates;
}

function getQueryAggregateNew(companyId, userId, eventId, statuses = null) {
  statuses = statuses || [constants.EVENT_STATUS.PREPARING, constants.EVENT_STATUS.OPENING];
  let and_arr = [{ deleted: false, company: new ObjectId(companyId), event: new ObjectId(eventId), status: { $in: statuses } }];
  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'participants',
      let: { comproject_id: '$_id', user_id: userId },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$user', '$$user_id'] },
              { $eq: ['$comproject', '$$comproject_id'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }],
      as: 'participant'
    }
  }, {
    $unwind: {
      path: '$participant',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $match: { participant: { $eq: null } }
  });

  aggregates.push({
    $lookup: {
      from: 'participants',
      let: { comproject_id: '$_id', company_id: companyId },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$comproject', '$$comproject_id'] },
              { $eq: ['$company', '$$company_id'] },
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
      as: 'countParticipant'
    }
  }, {
    $unwind: {
      path: '$countParticipant',
      preserveNullAndEmptyArrays: true
    }
  });

  aggregates.push({
    $lookup: {
      from: 'projects',
      localField: 'project',
      foreignField: '_id',
      as: 'project'
    }
  }, {
    $unwind: {
      path: '$project',
      preserveNullAndEmptyArrays: false
    }
  });

  aggregates.push({
    $lookup: {
      from: 'municipalities',
      localField: 'municipality',
      foreignField: '_id',
      as: 'municipality'
    }
  }, {
    $unwind: {
      path: '$municipality',
      preserveNullAndEmptyArrays: false
    }
  });

  aggregates.push({
    $group: {
      _id: '$project._id',
      doc: {
        '$first': '$$ROOT'
      }
    }
  });

  aggregates.push({
    $sort: { start: 1 }
  });

  return aggregates;
}

function getQueryAggregateForHistoriesJoinedEvent(companyId, userId) {
  let and_arr = [{ deleted: false, user: new ObjectId(userId) }];
  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'participants',
      let: { comproject_id: '$comproject', company_id: companyId },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$company', '$$company_id'] },
              { $eq: ['$comproject', '$$comproject_id'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }, {
        $group: {
          _id: {},
          total: { $sum: '$amount' }
        }
      }],
      as: 'resultTotalAmount'
    }
  }, {
    $unwind: {
      path: '$resultTotalAmount',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      totalAmountOfCompany: '$resultTotalAmount.total'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'comprojects',
      localField: 'comproject',
      foreignField: '_id',
      as: 'comproject'
    }
  }, {
    $unwind: {
      path: '$comproject',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      project_id: '$comproject.project',
      start: '$comproject.start',
      end: '$comproject.end'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'projects',
      localField: 'project_id',
      foreignField: '_id',
      as: 'project'
    }
  }, {
    $unwind: {
      path: '$project',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      projectImage: '$project.image',
      projectName: '$project.name',
      projectDescription: '$project.description'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'municipalities',
      localField: 'municipality',
      foreignField: '_id',
      as: 'municipality'
    }
  }, {
    $unwind: {
      path: '$municipality',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      municipalityName: '$municipality.name',
      municipalityPrefecture: '$municipality.prefecture'
    }
  });

  aggregates.push({
    $project: {
      _id: 1,
      steps: 1,
      amount: 1,
      rank: 1,
      point: 1,
      created: 1,
      user: 1,
      start: 1,
      end: 1,
      projectImage: 1,
      projectName: 1,
      projectDescription: 1,
      municipalityName: 1,
      municipalityPrefecture: 1,
      totalAmountOfCompany: 1
    }
  });

  aggregates.push({
    $sort: { created: -1 }
  });

  return aggregates;
}

function getQueryAggregateForListComprojects(eventId, companyId) {
  let and_arr = [{ deleted: false, event: new ObjectId(eventId), company: new ObjectId(companyId) }];
  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'participants',
      let: { comproject_id: '$_id', company_id: companyId },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$comproject', '$$comproject_id'] },
              { $eq: ['$company', '$$company_id'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }, {
        $group: {
          _id: {},
          numberOfParticipants: { $sum: 1 },
          totalAmounts: { $sum: '$amount' },
          totalSteps: { $sum: '$steps' }
        }
      }],
      as: 'groupedParticipant'
    }
  }, {
    $unwind: {
      path: '$groupedParticipant',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      numberOfParticipants: { $cond: ['$groupedParticipant', '$groupedParticipant.numberOfParticipants', 0] },
      totalAmounts: { $cond: ['$groupedParticipant', '$groupedParticipant.totalAmounts', 0] },
      totalSteps: { $cond: ['$groupedParticipant', '$groupedParticipant.totalSteps', 0] }
    }
  });

  aggregates.push({
    $lookup: {
      from: 'projects',
      localField: 'project',
      foreignField: '_id',
      as: 'project'
    }
  }, {
    $unwind: {
      path: '$project',
      preserveNullAndEmptyArrays: false
    }
  });

  aggregates.push({
    $project: {
      groupedParticipant: 0
    }
  });

  aggregates.push({
    $sort: { totalSteps: -1 }
  });

  return aggregates;
}
