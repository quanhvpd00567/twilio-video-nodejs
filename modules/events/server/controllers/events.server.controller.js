'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  User = mongoose.model('User'),
  Event = mongoose.model('Event'),
  Project = mongoose.model('Project'),
  Municipality = mongoose.model('Municipality'),
  Participant = mongoose.model('Participant'),
  Subsidiary = mongoose.model('Subsidiary'),
  SubsidiaryRank = mongoose.model('SubsidiaryRank'),
  Comproject = mongoose.model('Comproject'),
  path = require('path'),
  moment = require('moment'),
  fs = require('fs'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  helperMobile = require(path.resolve('./mobiles/controllers/help.mobile.controller')),
  eventsHelper = require(path.resolve('./modules/events/server/helpers/events.server.helper')),
  simulationServerController = require(path.resolve('./modules/core/server/controllers/simulation.server.controller')),
  mailerServerUtils = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  notificationServerUtil = require(path.resolve('./modules/core/server/utils/notification.server.util'));

const lang = 'ja';

// Create
exports.applyProjects = async function (req, res) {
  let session = null;
  try {
    let { event, projectIds } = req.body;
    const municipalityId = req.params && req.params.municipalityId;
    const _companyId = req.body && req.body.companyId;
    const companyId = _companyId || req.user && req.user.company;

    if (!municipalityId || !companyId || !event || !projectIds || projectIds.length === 0) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
    }

    // Set seconds to 0
    event.start = new Date(event.start).setSeconds(0, 0);
    event.end = new Date(event.end).setSeconds(0, 0);

    if (event.start < new Date()) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'event.project_apply.form.server.error.start_less_today') });
    }
    if (event.end <= event.start) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'event.project_apply.form.server.error.start_less_end') });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    let condition = { deleted: false, _id: { $in: projectIds } };
    let [projects, municipality, numberOfEvents, numberOfComprojects, isHasEventInPeriod] = await Promise.all([
      Project.find(condition).lean(),
      Municipality.findOne({ _id: municipalityId, deleted: false }).lean(),
      Event.countDocuments({}),
      Comproject.countDocuments({}),
      eventsHelper.isHasEventInPeriod(event.start, event.end, companyId)
    ]);

    if (isHasEventInPeriod) {
      abortTransaction();
      return res.status(422).send({ message: help.getMsLoc(lang, 'event.project_apply.form.server.error.start_end_selected_unavailable') });
    }

    if (!municipality) {
      abortTransaction();
      return res.status(422).send({ message: help.getMsLoc(lang, 'municipalities.server.error.not_found') });
    }

    projects = projects && projects.filter(item => item);
    if (!projects || projects.length === 0 || projects.length !== projectIds.length) {
      abortTransaction();
      return res.status(422).send({ message: help.getMsLoc(lang, 'project.server.error.not_found') });
    }

    for (const project of projects) {
      if (
        !project
        || new Date(event.start) < new Date(project.start) || new Date(event.start) > new Date(project.end)
        || new Date(event.end) < new Date(project.start) || new Date(event.end) > new Date(project.end)
      ) {
        abortTransaction();
        return res.status(422).send({ message: help.getMsLoc(lang, 'event.project_apply.form.server.error.invalid_start_end') });
      }
    }

    event.municipality = municipalityId;
    event.company = companyId;

    let eventCloned = JSON.parse(JSON.stringify(event));
    let newEvent = new Event(event);

    for (const project of projects) {
      let comprojectObject = JSON.parse(JSON.stringify(eventCloned));
      comprojectObject.project = project._id;
      comprojectObject.event = newEvent._id;
      numberOfComprojects += 1;
      comprojectObject.number = help.generateUniqueStringFromNumber(numberOfComprojects);

      let newComproject = new Comproject(comprojectObject);
      await newComproject.save({ session });
    }

    numberOfEvents += 1;
    newEvent.number = help.generateUniqueStringFromNumber(numberOfEvents);
    await newEvent.save({ session });

    await session.commitTransaction();
    session.endSession();

    try {
      // Push silent notification
      const users = await User.find({ deleted: false, roles: constants.ROLE.EMPLOYEE, company: companyId }).select('_id').lean();
      const userIds = users.map(item => item._id);
      if (userIds && userIds.length > 0) {
        notificationServerUtil.sendSilentEventOpeningOrPreparing(userIds);
      }
    } catch (error) {
      logger.error(error);
    }

    return res.json(newEvent);
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

exports.paging = async function (req, res) {
  try {
    const auth = req.user;
    let condition = req.body.condition || {};
    let company = auth.company;
    if (auth.roles[0] === constants.ROLE.ADMIN || auth.roles[0] === constants.ROLE.SUB_ADMIN) {
      company = condition.companyId;
    }
    if (!company) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
    }

    condition.company = company;

    const page = condition.page || 1;
    const limit = help.getLimit(condition);
    const options = { page: page, limit: limit };
    const aggregates = getQueryAggregate(condition);

    let result = await Event.aggregatePaginate(Event.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.pagingForMunicipality = async function (req, res) {
  try {
    let condition = req.body.condition || {};
    condition.municipality = req.user.municipality;
    const page = condition.page || 1;
    const limit = help.getLimit(condition);
    const options = { page: page, limit: limit };
    const aggregates = getQueryAggregatePagingForMunicipality(condition, req.user.roles);

    let result = await Event.aggregatePaginate(Event.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.detail = async function (req, res) {
  try {
    const eventId = req.params.eventId;
    const companyId = req.user.company || (req.query && req.query.companyId);
    if (!eventId || !companyId) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
    }

    const aggregates = getQueryAggregate({ company: companyId, eventId: eventId });
    let result = await Event.aggregate(aggregates).allowDiskUse(true);
    return res.json(result && result[0]);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  let session = null;
  try {
    const event = req.model;
    if (!event) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'event.server.error.not_found') });
    }
    if (event.status !== constants.EVENT_STATUS.PREPARING) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'event.list.server.error.opening') });
    }

    const comprojects = await Comproject.find({ deleted: false, event: event._id }).select('_id').lean();
    const comprojectIds = comprojects.map(item => item._id);
    const participant = await Participant.findOne({ deleted: false, comproject: { $in: comprojectIds } }).select('_id').lean();
    if (participant) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'event.list.server.error.delete.user_joined') });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    await Event.updateOne({ _id: event._id }, { deleted: true }, { session });
    await Comproject.updateMany({ event: event._id, deleted: false }, { deleted: true }, { session });

    await session.commitTransaction();
    session.endSession();

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

exports.update = async function (req, res) {
  try {
    const eventId = req.params.eventId;
    let event = await Event.updateOne({ _id: eventId, deleted: false }, req.body);
    return res.json(event);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.updatePayAndSendStatus = async function (req, res) {
  try {
    const eventId = req.params.eventId;
    const { pay_status, send_status } = req.body;
    if (!pay_status && !send_status) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    let event = await Event.findById(eventId)
      .populate([
        { path: 'municipality', select: 'name' },
        { path: 'company', select: 'name kind' }
      ]);
    if (!event) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'event.server.error.not_found') });
    }

    let originEvent = JSON.parse(JSON.stringify(event));
    if (pay_status) {
      event.pay_status = pay_status;
      await Promise.all([
        event.save(),
        Comproject.updateMany({ event: eventId, deleted: false }, { pay_status })
      ]);

      if (originEvent.status === constants.EVENT_STATUS.FINISHED && pay_status === constants.PAY_STATUS.FINISHED && pay_status !== originEvent.pay_status) {
        // send mail
        buildMailDataAndSend(originEvent);
      }
    } else if (send_status) {
      event.send_status = send_status;
      await Promise.all([
        event.save(),
        Comproject.updateMany({ event: eventId, deleted: false }, { send_status })
      ]);
    }

    return res.json(event);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }

  function buildMailDataAndSend(event) {
    let data = {
      amount: help.formatNumber(event.total),
      municName: event.municipality.name,
      companyName: helperMobile.parseCompanyName(event.company.kind, event.company.name)
    };

    User.find({ deleted: false, roles: { $in: [constants.ROLE.ADMIN, constants.ROLE.SUB_ADMIN] } }).select('email')
      .lean().exec().then(admins => {
        const emails = admins.map(item => item.email);
        if (emails.length > 0) {
          mailerServerUtils.sendMailUpdatePayAndSendStatusOfEvent(emails, data);
        }

        return true;
      }).catch(error => {
        logger.error(error);
        return false;
      });
  }
};

exports.read = async function (req, res) {
  return res.json(req.model);
};

exports.eventById = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  Event.findById(id)
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

exports.pagingComprojects = async function (req, res) {
  try {
    const eventId = req.params.eventId;
    if (!eventId) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
    }

    let condition = req.body.condition || {};
    condition.eventId = eventId;

    const page = condition.page || 1;
    const limit = help.getLimit(condition);
    const options = { page: page, limit: limit };
    const aggregates = getQueryAggregateForPagingComprojects(condition);

    let result = await Comproject.aggregatePaginate(Comproject.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getDataOfEventOpeningForHome = async function (req, res) {
  try {
    const companyId = req.user.company;
    if (!companyId) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
    }

    let eventOpening = await eventsHelper.getCurrentEventOpening(companyId);
    if (!eventOpening) {
      return res.json(null);
    }

    let comprojects = await Comproject.find({ deleted: false, event: eventOpening._id }).populate({ path: 'project', select: 'name description image' }).lean();
    const comprojectIds = comprojects.map(item => item._id);
    let [participants, subsidiaries, subsidiaryRanks] = await Promise.all([
      Participant.find({ deleted: false, comproject: { $in: comprojectIds } }).populate({ path: 'user', select: 'subsidiary' }).lean(),
      Subsidiary.find({ deleted: false, company: companyId }).lean(),
      SubsidiaryRank.find({ deleted: false, company: companyId, event: eventOpening._id }).lean()
    ]);

    // Data for comproject
    const groupDataByComproject = participants.reduce((result, item) => {
      const comprojectId = item.comproject.toString();
      if (result[comprojectId]) {
        result[comprojectId].numberOfParticipants += 1;
        result[comprojectId].totalSteps += item.steps;
        result[comprojectId].estimatedDonationAmounts += item.amount;
      } else {
        result[comprojectId] = {
          numberOfParticipants: 1,
          totalSteps: item.steps,
          estimatedDonationAmounts: item.amount
        };
      }
      return result;
    }, {});

    eventOpening.numberOfParticipants = 0;
    eventOpening.totalSteps = 0;
    eventOpening.estimatedDonationAmounts = 0;
    for (const comprojectId of Object.keys(groupDataByComproject)) {
      let comproject = comprojects.find(item => item._id.toString() === comprojectId);
      if (comproject) {
        comproject = Object.assign(comproject, groupDataByComproject[comprojectId]);
      }

      eventOpening.numberOfParticipants += groupDataByComproject[comprojectId].numberOfParticipants;
      eventOpening.totalSteps += groupDataByComproject[comprojectId].totalSteps;
      eventOpening.estimatedDonationAmounts += groupDataByComproject[comprojectId].estimatedDonationAmounts;
    }
    eventOpening.averageSteps = simulationServerController.calculateAverageStepsOfEvent(eventOpening.totalSteps, eventOpening.numberOfParticipants);

    // Data for subsidiaries
    participants = participants.filter(item => item.user && item.user.subsidiary);
    const groupDataBySubsidiary = participants.reduce((result, item) => {
      const subsidiaryId = item.user.subsidiary.toString();
      if (result[subsidiaryId]) {
        result[subsidiaryId].numberOfParticipants += 1;
        result[subsidiaryId].totalSteps += item.steps;
        result[subsidiaryId].estimatedDonationAmounts += item.amount;
      } else {
        result[subsidiaryId] = {
          numberOfParticipants: 1,
          totalSteps: item.steps,
          estimatedDonationAmounts: item.amount || 0
        };
      }
      return result;
    }, {});

    for (const subsidiaryId of Object.keys(groupDataBySubsidiary)) {
      let subsidiary = subsidiaries.find(item => item._id.toString() === subsidiaryId);
      if (subsidiary) {
        subsidiary = Object.assign(subsidiary, groupDataBySubsidiary[subsidiaryId]);

        const subsidiaryRank = subsidiaryRanks.find(item => item && item.subsidiary && item.subsidiary.toString() === subsidiaryId);
        subsidiary.averageSteps = subsidiaryRank ? subsidiaryRank.average_steps : simulationServerController.calculateAverageStepsOfEvent(subsidiary.totalSteps, subsidiary.numberOfParticipants);
      }
    }

    // Set default value for estimatedDonationAmounts
    subsidiaries = subsidiaries.map(item => {
      if (!item.estimatedDonationAmounts) {
        item.estimatedDonationAmounts = 0;
      }
      return item;
    });

    return res.json({ event: eventOpening, comprojects, subsidiaries });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.pagingForHome = async function (req, res) {
  try {
    const company = req.user.company;
    if (!company) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.error.permission') });
    }

    let condition = req.body.condition || {};
    condition.company = company;

    const page = condition.page || 1;
    const limit = help.getLimit(condition);
    const options = { page: page, limit: limit };
    const aggregates = getQueryAggregateForPagingHome(condition);

    let result = await Event.aggregatePaginate(Event.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);
    result.docs = result.docs.map(item => {
      item.average_steps = simulationServerController.calculateAverageStepsOfEvent(item.total_steps, item.number_of_participants);
      return item;
    });

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.municExport = function (req, res) {
  try {
    let condition = req.body.condition || {};
    condition.municipality = req.user.municipality;
    const aggregates = getQueryAggregatePagingForMunicipality(condition, req.user.roles);
    Event.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' })
      .then(result => {
        const excel = {
          dest: './modules/events/client/excel/',
          template: './modules/events/client/excel/templates/all.xlsx',
          export: './modules/events/client/excel/exports/'
        };

        const timePrefix = Date.now().toString();
        const pathFile = excel.export;
        const outFileCsv = pathFile + timePrefix + '_イベント一覧.csv';
        let writeStream = fs.createWriteStream(outFileCsv);

        // set header to csv
        const headers = ['イベントNo.', 'イベント名', '寄付会社', '寄付方法', '寄付ステータス', '郵送ステータス', '送付先郵便番号', '送付先住所', '宛名', '開始日時', '終了日時', '掲載ポリシー'];
        writeStream.write(headers.join(',') + '\n', () => { });

        result.forEach((someObject, index) => {
          let newLine = [];
          console.log(getValueByKey('pay_statuses', someObject.pay_status));
          newLine.push('"' + someObject.number ? someObject.number : '' + '"');
          newLine.push('"' + someObject.event_name ? someObject.event_name : '' + '"');
          newLine.push('"' + getFullCompanyName(someObject.company_kind, someObject.company_name) + '"');
          newLine.push('"' + getValueByKey('payment_methods', someObject.method) + '"');
          newLine.push('"' + someObject.pay_status ? getValueByKey('pay_statuses', someObject.pay_status) : '' + '"');
          newLine.push('"' + someObject.send_status ? getValueByKey('sent_statuses', someObject.send_status) : '' + '"');
          newLine.push('"' + someObject.zipcode ? someObject.zipcode : '' + '"');
          newLine.push('"' + someObject.address ? someObject.address : '' + '"');
          newLine.push('"' + someObject.name ? someObject.name : '' + '"');
          newLine.push('"' + moment(someObject.start).format('YYYY/MM/DD HH:mm') + '"');
          newLine.push('"' + moment(someObject.end).format('YYYY/MM/DD HH:mm') + '"');
          newLine.push('"' + getValueByKey('magazine_types', someObject.magazine) + '"');
          writeStream.write(newLine.join(',') + '\n', () => { });
        });

        writeStream.end();

        writeStream.on('finish', () => {
          console.log('finish write stream, moving along');
          return res.json({
            url: outFileCsv
          });
        }).on('error', (err) => {
          console.log(err);
        });
      });
  } catch (error) {
    logger.error(error);
  }
};

/** ====== PRIVATE ========= */
function getQueryAggregate(condition) {
  let and_arr = [{ deleted: false, company: new ObjectId(condition.company) }];

  // For detail function
  if (condition.eventId) {
    and_arr[0]._id = new ObjectId(condition.eventId);
  }

  if (condition.keyword && condition.keyword !== '') {
    const or_arr = [
      { event_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
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

  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  if (condition.status) {
    and_arr.push({ status: Number(condition.status) });
  }
  if (condition.method) {
    and_arr.push({ method: Number(condition.method) });
  }

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'municipalities',
      let: { municipality_id: '$municipality' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$_id', '$$municipality_id'] }
              // { $eq: ['$deleted', false] }
            ]
          }
        }
      }],
      as: 'municipality'
    }
  }, {
    $unwind: {
      path: '$municipality',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      municipality_name: '$municipality.name'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'comprojects',
      let: { event_id: '$_id' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$event', '$$event_id'] }
              // { $eq: ['$deleted', false] }
            ]
          }
        }
      }, {
        $group: {
          _id: {},
          projectIds: { $push: '$project' },
          comprojectIds: { $push: '$_id' }
        }
      }],
      as: 'comprojectsGrouped'
    }
  }, {
    $unwind: {
      path: '$comprojectsGrouped',
      preserveNullAndEmptyArrays: false
    }
  });

  aggregates.push({
    $lookup: {
      from: 'projects',
      let: { project_ids: { $cond: ['$comprojectsGrouped', '$comprojectsGrouped.projectIds', []] } },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $in: ['$_id', '$$project_ids'] }
              // { $eq: ['$deleted', false] }
            ]
          }
        }
      }, {
        $group: {
          _id: {},
          projectNames: { $push: '$name' }
        }
      }],
      as: 'projectsGrouped'
    }
  }, {
    $unwind: {
      path: '$projectsGrouped',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      project_names: '$projectsGrouped.projectNames'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'participants',
      let: { comproject_ids: { $cond: ['$comprojectsGrouped', '$comprojectsGrouped.comprojectIds', []] } },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $in: ['$comproject', '$$comproject_ids'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }, {
        $group: {
          _id: {},
          number_of_participants: { $sum: 1 }
        }
      }],
      as: 'participantsGrouped'
    }
  }, {
    $unwind: {
      path: '$participantsGrouped',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      number_of_participants: { $cond: ['$participantsGrouped', '$participantsGrouped.number_of_participants', 0] }
    }
  });

  aggregates.push({
    $project: {
      comprojectsGrouped: 0,
      projectsGrouped: 0,
      participantsGrouped: 0
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

function getQueryAggregatePagingForMunicipality(condition, roles) {
  let and_arr = [{ deleted: false }];
  if (help.isMunicAdminOrMunicMember(roles) && condition.municipality) {
    and_arr.push({ municipality: condition.municipality });
  }

  if (condition.keyword && condition.keyword !== '') {
    const or_arr = [
      { number: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { event_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
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

  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  if (condition.pay_status) {
    and_arr.push({ pay_status: Number(condition.pay_status) });
  }
  if (condition.send_status) {
    and_arr.push({ send_status: Number(condition.send_status) });
  }

  if (condition.status) {
    and_arr.push({ status: Number(condition.status) });
  }
  if (condition.method) {
    and_arr.push({ method: Number(condition.method) });
  }

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'municipalities',
      let: { municipality_id: '$municipality' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$_id', '$$municipality_id'] }
            ]
          }
        }
      }],
      as: 'municipality'
    }
  }, {
    $unwind: {
      path: '$municipality',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      municipality_name: '$municipality.name'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'companies',
      let: { company_id: '$company' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$_id', '$$company_id'] }
            ]
          }
        }
      }],
      as: 'company'
    }
  }, {
    $unwind: {
      path: '$company',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      company_name: '$company.name',
      company_kind: '$company.kind'
    }
  });

  aggregates.push({
    $project: {
      company: 0,
      municipality: 0
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

function getQueryAggregateForPagingComprojects(condition) {
  let and_arr = [{ deleted: false, event: new ObjectId(condition.eventId) }];
  if (condition.send_status) {
    and_arr.push({ send_status: Number(condition.send_status) });
  }
  if (condition.pay_status) {
    and_arr.push({ pay_status: Number(condition.pay_status) });
  }

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'municipalities',
      let: { municipality_id: '$municipality' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$_id', '$$municipality_id'] }
              // { $eq: ['$deleted', false] }
            ]
          }
        }
      }],
      as: 'municipality'
    }
  }, {
    $unwind: {
      path: '$municipality',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      municipality_name: '$municipality.name'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'projects',
      let: { project_id: '$project' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$_id', '$$project_id'] }
              // { $eq: ['$deleted', false] }
            ]
          }
        }
      }],
      as: 'project'
    }
  }, {
    $unwind: {
      path: '$project',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      project_name: '$project.name'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'events',
      let: { event_id: '$event' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$_id', '$$event_id'] }
              // { $eq: ['$deleted', false] }
            ]
          }
        }
      }],
      as: 'event'
    }
  }, {
    $unwind: {
      path: '$event',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      method: '$event.method',
      zipcode: '$event.zipcode',
      address: '$event.address',
      name: '$event.name',
      magazine: '$event.magazine'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'participants',
      let: { comproject_id: '$_id' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$comproject', '$$comproject_id'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }, {
        $group: {
          _id: {},
          numberOfParticipants: { $sum: 1 }
        }
      }],
      as: 'participantsGrouped'
    }
  }, {
    $unwind: {
      path: '$participantsGrouped',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      number_of_participants: { $cond: ['$participantsGrouped', '$participantsGrouped.numberOfParticipants', 0] }
    }
  });

  let second_and_arr = [];
  if (condition.keyword && condition.keyword !== '') {
    second_and_arr.push({ number: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
    second_and_arr.push({ project_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
  }

  if (condition.magazine) {
    second_and_arr.push({ magazine: Number(condition.magazine) });
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
      municipality: 0,
      project: 0,
      event: 0,
      participantsGrouped: 0
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

function getQueryAggregateForPagingHome(condition) {
  let and_arr = [{ deleted: false, company: new ObjectId(condition.company) }];
  if (condition.status) {
    and_arr.push({ status: Number(condition.status) });
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
      let: { event_id: '$_id' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$event', '$$event_id'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }, {
        $group: {
          _id: {},
          comprojectIds: { $push: '$_id' }
        }
      }],
      as: 'comprojectsGrouped'
    }
  }, {
    $unwind: {
      path: '$comprojectsGrouped',
      preserveNullAndEmptyArrays: false
    }
  });

  aggregates.push({
    $lookup: {
      from: 'participants',
      let: { comproject_ids: { $cond: ['$comprojectsGrouped', '$comprojectsGrouped.comprojectIds', []] } },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $in: ['$comproject', '$$comproject_ids'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }, {
        $group: {
          _id: {},
          number_of_participants: { $sum: 1 },
          total_steps: { $sum: '$steps' },
          estimated_donation_amount: { $sum: '$amount' }
        }
      }],
      as: 'participantsGrouped'
    }
  }, {
    $unwind: {
      path: '$participantsGrouped',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      number_of_participants: { $cond: ['$participantsGrouped', '$participantsGrouped.number_of_participants', 0] },
      total_steps: { $cond: ['$participantsGrouped', '$participantsGrouped.total_steps', 0] },
      estimated_donation_amount: { $cond: ['$participantsGrouped', '$participantsGrouped.estimated_donation_amount', 0] }
    }
  });

  aggregates.push({
    $lookup: {
      from: 'municipalities',
      let: { municipality_id: '$municipality' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$_id', '$$municipality_id'] }
              // { $eq: ['$deleted', false] }
            ]
          }
        }
      }],
      as: 'municipality'
    }
  }, {
    $unwind: {
      path: '$municipality',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $addFields: {
      municipality_name: '$municipality.name'
    }
  });

  aggregates.push({
    $project: {
      comprojectsGrouped: 0,
      participantsGrouped: 0,
      company: 0
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


function getFullCompanyName(kind, name) {
  var text = '';
  switch (kind) {
    case 1:
      text = '株式会社' + name;
      break;
    case 2:
      text = name + '株式会社';
      break;
    default:
      text = name;
      break;
  }

  return text;
}


function getValueByKey(key, id) {
  let list = [];

  if (key === 'sent_statuses') {
    list = [
      { id: 1, value: '未送付' },
      { id: 2, value: '送付済' }
    ];
  }
  if (key === 'magazine_types') {
    list = [
      { id: 1, value: '企業名と金額' },
      { id: 2, value: '企業名のみ' },
      { id: 3, value: '希望しない' }
    ];
  }
  if (key === 'pay_statuses') {
    list = [
      { id: 1, value: '未' },
      { id: 2, value: '済' }
    ];
  }
  if (key === 'payment_methods') {
    list = [
      { id: 1, value: '納付書' },
      { id: 2, value: '郵便振替' },
      { id: 3, value: '銀行振込' }
    ];
  }

  return showMasterValue(list, id);
}

function showMasterValue(list, id) {
  if (list && list.length > 0) {
    var index = -1;
    for (var i = 0; i < list.length; ++i) {
      if (list[i].id === id) {
        index = i;
        break;
      }
    }
    if (list[index] && list[index].value) {
      return list[index].value;
    }
    return id;
  }
  return id;
}
