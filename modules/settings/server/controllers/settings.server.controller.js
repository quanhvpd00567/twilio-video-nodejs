'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Config = mongoose.model('Config'),
  Device = mongoose.model('Device'),
  User = mongoose.model('User'),
  moment = require('moment-timezone'),
  ConfigSet = mongoose.model('ConfigSet'),
  Event = mongoose.model('Event'),
  Comproject = mongoose.model('Comproject'),
  path = require('path'),
  _ = require('lodash'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  translate = require(path.resolve('./config/locales/server/ja.json')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  NotificationUtil = require(path.resolve('./modules/core/server/controllers/notification.server.controller')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

exports.pagingPPSSetting = async function (req, res) {
  try {
    var condition = req.body.condition || {};
    var page = condition.page || 1;
    var query = getQuery();
    var sort = help.getSort(condition);
    var limit = help.getLimit(condition);
    const options = {
      sort: sort, page: page, limit: limit,
      collation: { locale: 'ja' }
    };
    const result = await ConfigSet.paginate(query, options);
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }

  function getQuery() {
    var and_arr = [{ deleted: false, type: constants.CONFIG_SET_TYPE.PPS }];
    return { $and: and_arr };
  }
};

exports.pagingAPSSetting = async function (req, res) {
  try {
    var condition = req.body.condition || {};
    var page = condition.page || 1;
    var query = getQuery();
    var sort = help.getSort(condition);
    var limit = help.getLimit(condition);
    const options = {
      sort: sort, page: page, limit: limit,
      collation: { locale: 'ja' }
    };
    const result = await ConfigSet.paginate(query, options);
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }

  function getQuery() {
    var and_arr = [{ deleted: false, type: constants.CONFIG_SET_TYPE.APS }];
    return { $and: and_arr };
  }
};

exports.addOrUpdateConfigSet = async function (req, res) {
  try {
    var body = req.body.configSet;

    // in case update current value
    if (body.isCurrentValue) {
      let updateValue = {};
      if (body.type === constants.CONFIG_SET_TYPE.PPS) {
        updateValue.pps = body.pps;
        await Config.updateOne({}, updateValue);
        return res.json(true);
      }
      if (body.type === constants.CONFIG_SET_TYPE.APS) {
        updateValue.minimum_donation_amount = body.minimum_donation_amount;
        updateValue.aps = body.aps;
        await Config.updateOne({}, updateValue);
        return res.json(true);
      }
    }

    // check duplicate pps_apply_start_date
    let condition = { type: body.type };
    if (body._id) {
      condition._id = { $ne: body._id };
    }
    if (body.pps_apply_start_date) {
      condition.pps_apply_start_date = body.pps_apply_start_date;
    }
    if (body.donation_amount_apply_start_date) {
      condition.donation_amount_apply_start_date = body.donation_amount_apply_start_date;
    }

    const isExisting = await ConfigSet.findOne(condition).lean();
    if (isExisting) {
      return res.status(422).send({ message: 'この適用開始日は既に使用されています。' });
    }

    // in case choose current date, update directly into config table
    let updateValue = {};
    if (body.type === constants.CONFIG_SET_TYPE.PPS && moment(body.pps_apply_start_date) <= moment()) {
      updateValue.pps = body.pps;
      updateValue.pps_applied_date = moment(body.pps_apply_start_date);
      body.is_applied = true;
      await Promise.all([
        Config.updateOne({}, updateValue),
        ConfigSet.create(body)
      ]);
      return res.json(true);
    }
    if (body.type === constants.CONFIG_SET_TYPE.APS && moment(body.donation_amount_apply_start_date) <= moment()) {
      updateValue.minimum_donation_amount = body.minimum_donation_amount;
      updateValue.aps = body.aps;
      updateValue.donation_amount_applied_date = moment(body.donation_amount_apply_start_date);
      body.is_applied = true;
      await Promise.all([
        Config.updateOne({}, updateValue),
        ConfigSet.create(body)
      ]);
      return res.json(true);
    }

    if (body && body._id) {
      // update
      await ConfigSet.updateOne({ _id: body._id }, body);
    } else {
      // create
      await ConfigSet.create(body);
    }

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.deleteConfigSet = async function (req, res) {
  try {
    var _id = req.body._id;
    await ConfigSet.deleteOne({ _id: _id });
    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

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
