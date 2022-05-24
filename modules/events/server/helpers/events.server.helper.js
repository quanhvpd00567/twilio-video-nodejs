'use strict';

var mongoose = require('mongoose'),
  Event = mongoose.model('Event'),
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants'));

exports.isHasEventInPeriod = async function (start, end, companyId) {
  try {
    if (!start || !end || !companyId) {
      return false;
    }
    let condition = {
      $or: [
        { start: { $gte: start, $lte: end } },
        { end: { $gte: start, $lte: end } },
        { $and: [{ start: { $lte: start } }, { end: { $gte: end } }] }
      ],
      deleted: false,
      company: companyId
    };
    const event = await Event.findOne(condition).select('_id').lean();
    return Boolean(event);
  } catch (error) {
    throw error;
  }
};

exports.getCurrentEventOpening = async function (companyId) {
  try {
    if (!companyId) {
      return null;
    }
    let condition = {
      status: constants.EVENT_STATUS.OPENING,
      deleted: false,
      company: companyId
    };
    const event = await Event.findOne(condition).lean();
    return event;
  } catch (error) {
    return null;
  }
};
