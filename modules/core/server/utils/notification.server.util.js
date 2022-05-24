const mongoose = require('mongoose');
const User = mongoose.model('User');
const path = require('path');
const logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller'));
const constants = require(path.resolve('./modules/core/server/shares/constants'));
const helper = require(path.resolve('./modules/core/server/controllers/help.server.controller'));
const notificationServerHelper = require(path.resolve('./modules/core/server/controllers/notification.server.controller'));
const language = 'ja';
const NOTICE_ID = constants.NOTICE_ID;

exports.sendNotificationAt18h = async function (userIds) {
  try {
    const title = helper.getServerMsLoc(language, 'server.notification.event.at_18h.title');
    const content = helper.getServerMsLoc(language, 'server.notification.event.at_18h.content');
    const data = { notiId: NOTICE_ID.AT_18H };
    await getUsersAndPushFCMs(title, content, data, userIds);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

exports.sendEventEnd = async function (userIds, projectName) {
  try {
    let title = helper.getServerMsLoc(language, 'server.notification.event.end.title');
    // title = title.replace('{0}', projectName);

    let content = helper.getServerMsLoc(language, 'server.notification.event.end.content');
    // content = content.replace('{0}', projectName);

    const data = { notiId: NOTICE_ID.EVENT_END };

    await getUsersAndPushFCMs(title, content, data, userIds);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

exports.sendSilentEventOpeningOrPreparing = async function (userIds) {
  try {
    const data = { notiId: NOTICE_ID.EVENT_OPENING_SILENT };
    await notificationServerHelper.executeSilentToMultiDevices(userIds, data);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

function getUsersAndPushFCMs(title, content, data, userIds = []) {
  try {
    const limit = 1000;
    return new Promise(function (resolve) {
      function pagingUsersCallback(page) {
        let query = { deleted: false, roles: constants.ROLE.EMPLOYEE };
        if (userIds && userIds.length > 0) {
          query._id = { $in: userIds };
        }

        User.paginate(query, {
          page: page,
          limit: limit,
          select: '_id devices settings',
          populate: [
            { path: 'devices' }
          ]
        }).then(async function (result) {
          if (!result || !result.totalDocs) {
            return resolve(true);
          }

          let users = result.docs;
          users = users.filter(user => user.settings && user.settings.receive_notification && user.devices && user.devices.length > 0);

          const pushFCMPromises = users.map(user => {
            return notificationServerHelper.pushText([user._id], title, content, data);
          });
          await Promise.all(pushFCMPromises);

          if (page < result.totalPages) {
            return pagingUsersCallback(++page);
          }

          return resolve(true);
        }).catch(function (error) {
          logger.error(error);
          return resolve(false);
        });
      }

      return pagingUsersCallback(1);
    });
  } catch (error) {
    logger.error(error);
  }
}
