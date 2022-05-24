'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Point = mongoose.model('Point'),
  PointLog = mongoose.model('PointLog'),
  PaymentHistory = mongoose.model('PaymentHistory'),
  moment = require('moment-timezone'),
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

exports.getCurrentPoints = async function (req, res) {
  try {
    const condition = req.body.condition || {};
    const page = condition.page || 1;
    const limit = help.getLimit(condition) || 5;
    const options = { page: page, limit: limit };
    const conditions = { deleted: false, is_expired: false, points: { $gt: 0 }, expire: { $gte: new Date() } };
    const aggregates = getQueryAggregate(conditions);

    let [result, points] = await Promise.all([
      Point.aggregatePaginate(Point.aggregate(aggregates).allowDiskUse(true), options),
      Point.find(conditions).populate({ path: 'municipality', select: 'deleted is_testing' }).select('points').lean()
    ]);

    result = help.parseAggregateQueryResult(result, page);

    points = points.filter(item => {
      return item.municipality && !item.municipality.is_testing;
    });
    points = points.reduce((total, item) => {
      return total + item.points;
    }, 0);
    result.totalPoints = points;

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getUsedPoints = async function (req, res) {
  try {
    const params = req.query;
    let { year, month } = params;
    if (!year) {
      year = moment().year();
    }
    if (!month) {
      month = moment().month() + 2;
    }
    year = Number(year);
    month = Number(month);

    const { start, end } = help.generateStartAndEndOfEconomicYear(year);
    const conditionsForTotalOfYear = {
      deleted: false,
      $and: [
        { created: { $gte: start.toDate() } },
        { created: { $lte: end.toDate() } }
      ]
    };
    const aggregatesForTotalOfYear = getQueryAggregateForUsedPoints(conditionsForTotalOfYear);

    // Get data of previous month
    if (month === 1) {
      month = 12;
    } else {
      month -= 1;
    }
    const startAndEndOfMonth = help.generateStartAndEndOfMonthOfEconomicYear(year, month);
    const startOfMonth = startAndEndOfMonth.start;
    const endOfMonth = startAndEndOfMonth.end;
    const conditionsForMonth = {
      deleted: false,
      $and: [
        { created: { $gte: startOfMonth.toDate() } },
        { created: { $lte: endOfMonth.toDate() } }
      ]
    };

    let [totalResult, paymentHistories] = await Promise.all([
      PaymentHistory.aggregate(aggregatesForTotalOfYear),
      PaymentHistory.find(conditionsForMonth).populate([
        { path: 'municipality', select: 'name deleted is_testing' }
      ])
    ]);
    const totalPointsUsedOfYear = totalResult && totalResult[0] && totalResult[0].points;
    const totalPaymentAmountsOfYear = totalResult && totalResult[0] && totalResult[0].amount;

    paymentHistories = paymentHistories.filter(item => {
      return item.municipality && !item.municipality.is_testing;
    });
    const totalPaymentAmountsOfMonth = paymentHistories.reduce((total, item) => {
      return total + item.amount;
    }, 0);

    return res.json({ totalPointsUsedOfYear, totalPaymentAmountsOfYear, totalPaymentAmountsOfMonth, paymentHistories: paymentHistories });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getExpiredPoints = async function (req, res) {
  try {
    const params = req.query;
    let year = params && params.year || new Date().getFullYear();
    year = Number(year);
    const { start, end } = help.generateStartAndEndOfEconomicYear(year);

    const conditions = {
      deleted: false, type: constants.POINT_LOG_TYPE.EXPIRATION,
      $and: [
        { created: { $gte: start.toDate() } },
        { created: { $lte: end.toDate() } }
      ]
    };
    const aggregates = getQueryAggregateForExpiredPoints(conditions);
    const pointLogs = await PointLog.aggregate(aggregates).allowDiskUse(true);
    const totalPointsExpired = pointLogs.reduce((total, item) => {
      return total + item.points;
    }, 0);

    return res.json({ totalPointsExpired, pointsExpired: pointLogs });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.updatePaymentStatus = async function (req, res) {
  try {
    const paymentHistoryId = req.params.paymentHistoryId;
    const isPaid = req.body.isPaid;
    let updateData = { is_paid: isPaid };
    if (isPaid) {
      updateData.payment_date = new Date();
    }
    await PaymentHistory.updateOne({ _id: paymentHistoryId }, updateData);

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};


/** ====== PRIVATE ========= */
function getQueryAggregate(conditions) {
  let and_arr = [conditions];

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });
  aggregates.push({
    $addFields: {
      yearMonthDate: {
        $concat: [
          { $toString: { $year: { date: '$expire', timezone: 'Asia/Tokyo' } } }, '/',
          { $toString: { $month: { date: '$expire', timezone: 'Asia/Tokyo' } } }, '/',
          { $toString: { $dayOfMonth: { date: '$expire', timezone: 'Asia/Tokyo' } } }
        ]
      }
    }
  });

  aggregates.push({
    $group: {
      _id: {
        municipality: '$municipality',
        expire: '$yearMonthDate'
      },
      points: { $sum: '$points' },
      doc: {
        '$first': '$$ROOT'
      }
    }
  }, {
    $addFields: {
      municipality: '$_id.municipality',
      expire: '$_id.expire',
      points: '$points',
      expire_date: '$doc.expire'
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
    $match: {
      $and: [
        // { 'municipality.deleted': { $eq: false } },
        {
          $or: [
            { 'municipality.is_testing': null },
            { 'municipality.is_testing': false }
          ]
        }
      ]
    }
  }, {
    $addFields: {
      municipality_id: '$municipality._id',
      municipality_name: '$municipality.name'
    }
  }, {
    $project: {
      municipality: 0
    }
  });

  aggregates.push({
    $project: {
      _id: 0,
      municipality: 0
    }
  });

  aggregates.push({
    $sort: { expire_date: 1 }
  });

  return aggregates;
}

function getQueryAggregateForExpiredPoints(conditions) {
  let and_arr = [conditions];

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });
  aggregates.push({
    $addFields: {
      yearMonthDate: {
        $concat: [
          { $toString: { $year: { date: '$created', timezone: 'Asia/Tokyo' } } }, '/',
          { $toString: { $month: { date: '$created', timezone: 'Asia/Tokyo' } } }, '/',
          { $toString: { $dayOfMonth: { date: '$created', timezone: 'Asia/Tokyo' } } }
        ]
      }
    }
  });

  aggregates.push({
    $group: {
      _id: {
        municipality: '$municipality',
        created: '$yearMonthDate'
      },
      points: { $sum: '$points' },
      doc: {
        '$first': '$$ROOT'
      }
    }
  }, {
    $addFields: {
      municipality: '$_id.municipality',
      created: '$_id.created',
      points: '$points',
      created_date: '$doc.created'
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
    $match: {
      $and: [
        // { 'municipality.deleted': { $eq: false } },
        {
          $or: [
            { 'municipality.is_testing': null },
            { 'municipality.is_testing': false }
          ]
        }
      ]
    }
  }, {
    $addFields: {
      municipality_id: '$municipality._id',
      municipality_name: '$municipality.name'
    }
  }, {
    $project: {
      municipality: 0
    }
  });

  aggregates.push({
    $project: {
      _id: 0,
      municipality: 0
    }
  });

  aggregates.push({
    $sort: { created_date: 1 }
  });

  return aggregates;
}

function getQueryAggregateForUsedPoints(conditions) {
  let and_arr = [conditions];

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
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
    $match: {
      $and: [
        // { 'municipality.deleted': { $eq: false } },
        {
          $or: [
            { 'municipality.is_testing': null },
            { 'municipality.is_testing': false }
          ]
        }
      ]
    }
  }, {
    $project: {
      municipality: 0
    }
  });

  aggregates.push({
    $group: {
      _id: {},
      points: { $sum: '$points' },
      amount: { $sum: '$amount' }
    }
  });

  return aggregates;
}
