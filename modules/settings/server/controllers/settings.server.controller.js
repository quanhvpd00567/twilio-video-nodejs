'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Config = mongoose.model('Config'),
  Device = mongoose.model('Device'),
  User = mongoose.model('User'),
  path = require('path'),
  _ = require('lodash'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  NotificationUtil = require(path.resolve('./modules/core/server/controllers/notification.server.controller')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

exports.read = function (req, res) {
  Config.findOne({}).exec(function (err, setting) {
    if (err) {
      logger.error(err);
      return res
        .status(422)
        .send({ message: help.getMsLoc() });
    } else if (!setting) {
      setting = new Config();
      setting.version = new Date().getTime();
      setting.save(function (err) {
        if (err) {
          logger.error(err);
          return res
            .status(422)
            .send({ message: help.getMsLoc('ja', 'setting_version.form.server.error.update_failed') });
        }
        return res.json(setting);
      });
    } else {
      res.json(setting);
    }
  });
};

exports.update = async function (req, res) {
  let session = null;
  try {
    let email = req.body.setting.email;

    let setting = await Config.findOne({})
      .exec()
      .then(setting => {
        return setting;
      });

    if (email) {
      // check email
      const email_lower = trimAndLowercase(email);
      let isExistEmail = await User.findOne({ email_lower: email_lower, deleted: false, _id: { $ne: req.user._id } }).lean();
      if (isExistEmail) {
        return res.status(422).send({ message: help.getMsLoc('ja', 'common.server.email.error.exists') });
      }
    }

    setting = _.extend(setting, req.body.setting);
    setting.version = new Date().getTime();

    setting.save(async function (err) {
      if (err) {
        logger.error(err);
        return res.status(422).send({ message: help.getMsLoc('ja', 'setting_version.form.server.error.update_failed') });
      }
    });

    session = await mongoose.startSession();
    session.startTransaction();
    if (email) {
      await User.findOneAndUpdate({ _id: req.user._id }, { email_lower: trimAndLowercase(email), email: email }).session(session);
    }

    await session.commitTransaction();
    session.endSession();

    return res.json(setting);
  } catch (error) {
    if (session) {
      session.abortTransaction().then(() => {
        session.endSession();
      });
    }

    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.push = async function (req, res) {
  try {
    let os = req.body.os;
    const config = await Config.findOne({}).lean();
    if (!config) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    /*
     - version app of user < config.version && version app of user > config.version_require => OPTIONAL (can ignore)
     - version app of user < config.version && version app of user < config.version_require => REQUIRED (can't ignore, need to update app)
   */

    let dataVersionOptional = dataVersion(config, os, constants.UPDATE_APP_TYPE.OPTIONAL);
    let dataVersionRequired = dataVersion(config, os, constants.UPDATE_APP_TYPE.REQUIRED);
    dataVersionOptional.notiId = constants.NOTICE_ID.NEW_VERSION_APP_NOTICE;
    dataVersionRequired.notiId = constants.NOTICE_ID.NEW_VERSION_APP_NOTICE;

    const userIds = await findUsers();
    const [devicesForOptional, devicesForRequired] = await Promise.all([
      findDevices(userIds, os, config, constants.UPDATE_APP_TYPE.OPTIONAL),
      findDevices(userIds, os, config, constants.UPDATE_APP_TYPE.REQUIRED)
    ]);

    const title = help.getServerMsLoc('ja', 'server.notification.new_version_app.title');
    const content = help.getServerMsLoc('ja', 'server.notification.new_version_app.content');

    const pushNotificationOptionalUpdateAppPromises = devicesForOptional.map(device => {
      return NotificationUtil.excute_text(device, title, content, dataVersionOptional);
    });
    const pushNotificationRequiredUpdateAppPromises = devicesForRequired.map(device => {
      return NotificationUtil.excute_text(device, title, content, dataVersionRequired);
    });

    const pushNotificationPromises = pushNotificationOptionalUpdateAppPromises.concat(pushNotificationRequiredUpdateAppPromises);
    await Promise.all(pushNotificationPromises);
    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }

  function findDevices(userIds, os, config, updateAppType) {
    return new Promise(function (resolve, reject) {
      const cfgApp = config.app;
      let version;
      let version_require;
      if (os === 'ios') {
        version = parseFloat(cfgApp.ios_version);
        version_require = parseFloat(cfgApp.ios_version_require);
      } else {
        version = parseFloat(cfgApp.android_version);
        version_require = parseFloat(cfgApp.android_version_require);
      }

      let and_arr = [{ user: { $in: userIds } }, { os: os }];
      if (updateAppType === constants.UPDATE_APP_TYPE.OPTIONAL) {
        and_arr.push({ version: { $lt: version } });
        and_arr.push({ version: { $gte: version_require } });
      } else {
        // and_arr.push({ version: { '$lt': version } });
        and_arr.push({ version: { $lt: version_require } });
      }

      Device.find({ $and: and_arr }).exec((err, devices) => {
        if (err) return reject(err);
        return resolve(devices);
      });
    });
  }

  function findUsers() {
    return new Promise(function (resolve, reject) {
      var roles = [constants.ROLE.EMPLOYEE];

      User.find({ roles: { $in: roles }, deleted: false })
        .select('_id')
        .exec((err, userIds) => {
          if (err) return reject(err);
          return resolve(userIds);
        });
    });
  }

  function dataVersion(config, os, updateAppType) {
    let obj = {
      link: '', version: '',
      message: help.getServerMsLoc('js', 'system.version.update_app_required'),
      required: true
    };
    if (updateAppType === constants.UPDATE_APP_TYPE.OPTIONAL) {
      obj.message = help.getServerMsLoc('js', 'system.version.update_app_optional');
      obj.required = false;
    }

    const cfgApp = config.app;
    if (os === 'ios') {
      obj.link = cfgApp.ios_link;
      obj.version = cfgApp.ios_version;
    } else {
      obj.link = cfgApp.android_link;
      obj.version = cfgApp.android_version;
    }

    return obj;
  }
};

exports.getTermPolicty = async function (req, res) {
  let info = await Config.findOne({}).select('term policy');

  return res.json(info);
};

function trimAndLowercase(data) {
  if (!data) {
    return '';
  }

  data = data.trim();
  data = data && data.toLowerCase();

  return data;
}
