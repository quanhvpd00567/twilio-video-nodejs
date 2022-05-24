'use strict';

var mongoose = require('mongoose'),
  Point = mongoose.model('Point'),
  PointLog = mongoose.model('PointLog'),
  path = require('path'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants'));

exports.execute = function () {
  check_point_expire();
};

async function check_point_expire() {
  let session = null;
  try {
    console.info('Runing job: check_point_expire');
    const current = new Date();
    const condition = {
      deleted: false,
      is_expired: false,
      points: { $gt: 0 },
      expire: { $lt: current }
    };

    const points = await Point.find(condition).lean();
    if (points.length === 0) {
      return;
    }

    session = await mongoose.startSession();
    session.startTransaction();

    let pointLogs = [];
    let pointIds = [];
    points.forEach(item => {
      const pointLog = {
        user: item.user,
        points: item.points,
        type: constants.POINT_LOG_TYPE.EXPIRATION,
        project: item.project,
        municipality: item.municipality
      };
      pointLogs.push(pointLog);
      pointIds.push(item._id);
    });

    await PointLog.insertMany(pointLogs, { session });
    await Point.updateMany({ _id: { $in: pointIds }, deleted: false }, { is_expired: true }, { session });

    await session.commitTransaction();
    session.endSession();

    return true;
  } catch (error) {
    abortTransaction();
    logger.error(error);
    return false;
  }

  function abortTransaction() {
    if (session) {
      session.abortTransaction().then(() => {
        session.endSession();
      });
    }
  }
}
