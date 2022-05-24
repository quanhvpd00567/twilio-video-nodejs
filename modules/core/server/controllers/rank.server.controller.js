'use strict';
var path = require('path'),
  _ = require('lodash'),
  moment = require('moment-timezone'),
  mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  Subsidiary = mongoose.model('Subsidiary'),
  Event = mongoose.model('Event'),
  Comproject = mongoose.model('Comproject'),
  Participant = mongoose.model('Participant'),
  SubsidiaryRank = mongoose.model('SubsidiaryRank'),
  DepartmentRank = mongoose.model('DepartmentRank'),
  Daily = mongoose.model('Daily'),
  Department = mongoose.model('Department'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  helper = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants'));
// 1. Employee join event
// 2. update daily activity
// 3. Delete employee
// 4. Add new subsidiary
exports.recalculateRanksForComproject = async function (comprojectId, companyId) {
  try {
    const comproject = await Comproject.findById(comprojectId).lean();
    if (!comproject) {
      return;
    }
    const eventId = comproject.event;
    const [comprojects, event] = await Promise.all([
      Comproject.find({ deleted: false, event: eventId }).select('_id').lean(),
      Event.findById(eventId).select('_id is_cal_rank_growth_rank').lean()
    ]);
    const comprojectIds = comprojects.map(item => item._id);

    const isStartedOver7Days = helper.isEventStartedOver7Days(comproject.start);
    let getDailiesPromises = null;
    if (isStartedOver7Days) {
      getDailiesPromises = Daily.find({
        deleted: false,
        date_query: {
          $gte: moment(comproject.start).startOf('day'),
          $lte: moment(comproject.end).endOf('day')
        }
      }).lean();
    }
    // calculate rank in participant & rank in subsidiary-rank table
    let [participants, subsidiaries, departments, dailies] = await Promise.all([
      Participant.find({ event: eventId, deleted: false }).sort({ steps: -1 }).lean(),
      getUsersOfSubsidiaries(companyId, comprojectIds),
      getUsersOfDepartments(companyId, comprojectIds),
      getDailiesPromises
    ]);
    participants = getRanks(participants, 'rank', 'steps');

    if (isStartedOver7Days && dailies && dailies.length > 0) {
      // Calculate rank growth rate
      participants = calculateGrowthRateOfParticipants(participants, dailies, comprojectIds, comproject.start, comproject.end);
      participants = _.orderBy(participants, ['growth_rate_percent'], 'desc');
      participants = getRanks(participants, 'rank_growth_rate', 'growth_rate_percent');
    }

    const updateRankPromises = participants.map(item => {
      let subsidiary = subsidiaries.find(element => {
        return element.user_ids && element.user_ids.indexOf(item.user.toString()) !== -1;
      });
      if (subsidiary) {
        subsidiary.totalSteps += item.steps;
      }

      let department = departments.find(element => {
        return element.user_ids && element.user_ids.indexOf(item.user.toString()) !== -1;
      });
      if (department) {
        department.totalSteps += item.steps;
      }

      let updateData = { rank: item.rank };
      if (item.rank_growth_rate) {
        updateData.rank_growth_rate = item.rank_growth_rate;
      }
      if (item.growth_rate_percent === constants.UNDEFINED_VALUE) {
        updateData.growth_rate_percent = 0;
      } else {
        updateData.growth_rate_percent = item.growth_rate_percent;
      }
      return Participant.updateOne({ _id: item._id }, updateData);
    });

    subsidiaries = subsidiaries.map(item => {
      if (!item.user_ids || item.user_ids === 0) {
        item.average_steps = 0;
      } else {
        item.average_steps = item.totalSteps / item.user_ids.length;
      }

      return item;
    });

    departments = departments.map(item => {
      if (!item.user_ids || item.user_ids === 0) {
        item.average_steps = 0;
      } else {
        item.average_steps = item.totalSteps / item.user_ids.length;
      }

      return item;
    });

    subsidiaries = _.orderBy(subsidiaries, ['average_steps'], ['desc']);
    subsidiaries = getRanks(subsidiaries, 'rank', 'average_steps');
    const updateOrCreateSubsidiaryRankRecordPromises = subsidiaries.map(item => {
      return SubsidiaryRank.findOneAndUpdate(
        { company: companyId, subsidiary: item._id, event: eventId, deleted: false },
        { rank: item.rank, average_steps: item.average_steps, total_steps: item.totalSteps },
        { setDefaultsOnInsert: true, new: true, upsert: true }
      );
    });

    const subsidiaryIds = subsidiaries.map(item => item._id);
    subsidiaryIds.forEach(subsidiaryId => {
      let subdepartments = departments.filter(department => department.subsidiary.toString() === subsidiaryId.toString());
      subdepartments = _.orderBy(subdepartments, ['average_steps'], ['desc']);
      subdepartments = getRanks(subdepartments, 'rank', 'average_steps');
    });
    const updateOrCreateDepartmentRankRecordPromises = departments.map(item => {
      return DepartmentRank.findOneAndUpdate(
        { company: companyId, subsidiary: item.subsidiary, department: item._id, event: eventId, deleted: false },
        { rank: item.rank, average_steps: item.average_steps, total_steps: item.totalSteps },
        { setDefaultsOnInsert: true, new: true, upsert: true }
      );
    });

    await Promise.all([...updateRankPromises, ...updateOrCreateSubsidiaryRankRecordPromises, ...updateOrCreateDepartmentRankRecordPromises]);

    try {
      if (event && !event.is_cal_rank_growth_rank) {
        Event.updateOne({ _id: eventId }, { is_cal_rank_growth_rank: true }).exec();
      }
    } catch (error) {
      logger.error(error);
    }
  } catch (error) {
    logger.error(error);
  }
};

function getRanks(data, keyRank, keyOrder) {
  const array = data.map(item => item[keyOrder]);
  return data.map(item => {
    item[keyRank] = array.indexOf(item[keyOrder]) + 1;
    return item;
  });
}

async function getUsersOfSubsidiaries(companyId, comprojectIds) {
  let and_arr = [{ deleted: false, company: new ObjectId(companyId) }];
  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'users',
      let: { subsidiary_id: '$_id', company_id: companyId, comproject_ids: comprojectIds },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$deleted', false] },
              { $eq: ['$subsidiary', '$$subsidiary_id'] },
              { $eq: ['$company', '$$company_id'] },
              { $in: ['$comproject_joining', '$$comproject_ids'] },
              { $in: [constants.ROLE.EMPLOYEE, '$roles'] }
            ]
          }
        }
      }, {
        $group: {
          _id: '$subsidiary',
          user_ids: { $push: { $toString: '$_id' } }
        }
      }],
      as: 'usersGrouped'
    }
  }, {
    $unwind: {
      path: '$usersGrouped',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      totalSteps: 0
    }
  }, {
    $project: {
      _id: 1,
      totalSteps: 1,
      user_ids: '$usersGrouped.user_ids'
    }
  });

  const result = await Subsidiary.aggregate(aggregates).allowDiskUse(true);
  return result;
}

async function getUsersOfDepartments(companyId, comprojectIds) {
  let and_arr = [{ deleted: false, company: new ObjectId(companyId) }];
  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'users',
      let: { department_id: '$_id', company_id: companyId, comproject_ids: comprojectIds },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$deleted', false] },
              { $eq: ['$e_department', '$$department_id'] },
              { $eq: ['$company', '$$company_id'] },
              { $in: ['$comproject_joining', '$$comproject_ids'] },
              { $in: [constants.ROLE.EMPLOYEE, '$roles'] }
            ]
          }
        }
      }, {
        $group: {
          _id: '$e_department',
          user_ids: { $push: { $toString: '$_id' } }
        }
      }],
      as: 'usersGrouped'
    }
  }, {
    $unwind: {
      path: '$usersGrouped',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      totalSteps: 0
    }
  }, {
    $project: {
      _id: 1,
      subsidiary: 1,
      totalSteps: 1,
      user_ids: '$usersGrouped.user_ids'
    }
  });

  const result = await Department.aggregate(aggregates).allowDiskUse(true);
  return result;
}

function calculateGrowthRateOfParticipants(participants, dailies, comprojectIds, startOfEvent, endOfEvent) {
  if (!participants || !dailies) {
    return participants;
  }

  const startOf6DaysBefore = moment().add(-6, 'days').startOf('day');
  const endOf7DaysBefore = moment().add(-7, 'days').endOf('day');

  return participants.map(participant => {
    const dailiesOfUserLast7Days = dailies.filter(item => {
      return item.user.toString() === participant.user.toString()
        && moment(item.date_query) >= startOf6DaysBefore && moment(item.date_query) <= moment(endOfEvent);
    });
    const dailiesOfUserBefore7Days = dailies.filter(item => {
      return item.user.toString() === participant.user.toString()
        && moment(item.date_query) >= moment(startOfEvent) && moment(item.date_query) <= endOf7DaysBefore;
    });
    const stepsOfEventLast7Days = dailiesOfUserLast7Days.reduce((total, daily) => {
      comprojectIds.forEach(comprojectId => {
        if (daily.events && daily.events[comprojectId.toString()]) {
          total += daily.events[comprojectId.toString()].steps;
        }
      });
      return total;
    }, 0);
    const stepsOfEventBefore7Days = dailiesOfUserBefore7Days.reduce((total, daily) => {
      comprojectIds.forEach(comprojectId => {
        if (daily.events && daily.events[comprojectId.toString()]) {
          total += daily.events[comprojectId.toString()].steps;
        }
      });
      return total;
    }, 0);
    const numberOfDaysFromStartEventToBefore7Days = helper.getDaysBetweenTwoDate(startOfEvent, endOf7DaysBefore);

    if (!numberOfDaysFromStartEventToBefore7Days) {
      participant.growth_rate_percent = constants.UNDEFINED_VALUE;
    } else {
      const stepsAverage = stepsOfEventBefore7Days ? (stepsOfEventBefore7Days / numberOfDaysFromStartEventToBefore7Days) : 1;
      participant.growth_rate_percent = helper.floor1Decimal(((stepsOfEventLast7Days / 7) / stepsAverage) * 100);
    }

    return participant;
  });
}
