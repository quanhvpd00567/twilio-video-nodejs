'use strict';

var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  path = require('path'),
  moment = require('moment-timezone'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  notificationServerUtil = require(path.resolve('./modules/core/server/utils/notification.server.util'));

moment.tz.setDefault('Asia/Tokyo');
moment.locale('ja');

exports.execute = function () {
  push_user_joining_event();
};

async function push_user_joining_event() {
  try {
    console.info('Runing job: push user joining event');
    const condition = {
      deleted: false,
      roles: constants.ROLE.EMPLOYEE,
      comproject_joining: { $ne: null }
    };

    const users = await User.find(condition).select('_id');
    if (users.length === 0) {
      return;
    }

    const userIds = users.map(item => item._id);
    if (userIds && userIds.length > 0) {
      notificationServerUtil.sendNotificationAt18h(userIds);
    }

    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
}
