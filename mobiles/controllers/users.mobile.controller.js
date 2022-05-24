'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash'),
  mongoose = require('mongoose'),
  moment = require('moment-timezone'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  helper = require(path.resolve('./mobiles/controllers/help.mobile.controller')),
  logger = require(path.resolve('./mobiles/controllers/logger.mobile.controller')),
  User = mongoose.model('User'),
  Event = mongoose.model('Event'),
  Comproject = mongoose.model('Comproject'),
  Daily = mongoose.model('Daily'),
  Device = mongoose.model('Device'),
  Company = mongoose.model('Company'),
  Config = mongoose.model('Config'),
  Participant = mongoose.model('Participant'),
  Point = mongoose.model('Point'),
  PointLog = mongoose.model('PointLog'),
  StepHistory = mongoose.model('StepHistory'),
  Department = mongoose.model('Department'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  mailerServerUtils = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  master_data = require(path.resolve('./config/lib/master-data')),
  translate = require(path.resolve('./config/locales/mobile/ja.json')),
  simulationServerController = require(path.resolve('./modules/core/server/controllers/simulation.server.controller')),
  rankServerController = require(path.resolve('./modules/core/server/controllers/rank.server.controller')),
  helperServer = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

mongoose.Promise = require('bluebird');
moment.tz.setDefault('Asia/Tokyo');
moment.locale('ja');
const ONE_DAY_IN_MILLISECOND = 24 * 60 * 60 * 1000;

const isCheckMaxDonationAmount = true;
/**
* @function ログイン
* @param username(ログインID)
* @param password(パスワード)
* @param uuid
* @param os
* @param registrationId
* @returns { user: object, device: object }
*/
exports.signin = async function (req, res, next) {
  try {
    req.checkBody('email', translate['user.signin.email.required']).notEmpty();
    req.checkBody('password', translate['user.signin.password.required']).notEmpty();
    req.checkBody('uuid', translate['user.signin.uuid.required']).notEmpty();
    var errors = req.validationErrors();
    if (errors) {
      return res.status(403).send(helper.getMessage(errors));
    }

    var email = req.body.email;
    var password = req.body.password;
    var uuid = req.body.uuid;
    var registrationId = req.body.registrationId || '';
    var info = req.body.info;
    var os = req.headers.os || '';
    var version = req.headers.version || '';

    const result = await doLogin(email, password, uuid, registrationId, os, version, info);
    if (result.success) {
      return res.json(result.data);
    }

    return res.status(422).send({ message: result.message || translate['system.server.error'] });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

async function doLogin(email, password, uuid, registrationId, os, version, info) {
  try {
    let [verifyEmailAndPasswordResult, device, config] = await Promise.all([
      verifyEmailAndPassword(email, password),
      Device.findOne({ uuid: uuid }),
      Config.findOne({})
    ]);
    if (!verifyEmailAndPasswordResult.success) {
      return verifyEmailAndPasswordResult;
    }

    let user = verifyEmailAndPasswordResult.user;
    if (!device) {
      const deviceCode = await helper.generateUniqueCharacters('device', 12);
      var deviceData = { uuid: uuid, code: deviceCode, registrationId: registrationId, os: os, version: version, time: new Date(), info: info };
      deviceData.token = Device.createToken();
      deviceData.user = user._id;

      device = await createDevice(deviceData);
    } else {
      let deviceObject = { user: user._id, time: Date.now(), token: Device.createToken() };
      if (registrationId) {
        deviceObject.registrationId = registrationId;
      }
      if (version) {
        deviceObject.version = version;
      }
      if (info) {
        deviceObject.info = info;
      }

      // Add code if device don't have code
      if (!device.code) {
        deviceObject.code = await helper.generateUniqueCharacters('device', 12);
      }

      device = await Device.findByIdAndUpdate(device._id, deviceObject, { new: true });
    }

    // Increase login times
    // Remove token and user in old devices of user if existing
    await Promise.all([
      User.findByIdAndUpdate(user._id, { last_login: Date.now(), $inc: { login_times: 1 }, devices: [device._id] }, { new: true }),
      Device.updateMany({ user: user._id, _id: { $ne: device._id } }, { token: null, user: null })
    ]);

    device = JSON.parse(JSON.stringify(device));
    delete device.info;
    const returnUser = pickUser(user);
    return { success: true, data: { user: returnUser, device: device, version: config && config.version || '' } };
  } catch (error) {
    logger.error(error);
    throw error;
  }

  async function verifyEmailAndPassword(email, password) {
    const email_lower = trimAndLowercase(email);
    const user = await User.findOne({ email_lower, roles: constants.ROLE.EMPLOYEE, deleted: false });

    if (!user) {
      return { success: false, message: translate['user.signin.user.null'] };
    }

    if (!user.authenticate(password))
      return { success: false, message: translate['user.signin.user.wrong'] };

    if (!isEmployee(user.roles)) {
      return { success: false, message: translate['user.signin.role.invalid'] };
    }
    // if (user.status === constants.USER_STATUS.PENDING) {
    //   return { success: false, message: translate['user.signin.status.pending'] };
    // }

    return { success: true, user };
  }

  async function createDevice(deviceData) {
    let device = new Device(deviceData);
    await device.save();
    return device;
  }
}

/**
* @function ログアウト
 * @param userId
 * @param uuid
 * @returns status 200
 */
exports.signout = function (req, res) {
  req.checkBody('uuid', translate['user.signout.uuid.required']).notEmpty();
  var errors = req.validationErrors();
  if (errors)
    return res.status(403).send(helper.getMessage(errors));
  var userId = req.user._id;
  var uuid = req.body.uuid;

  Device.findOneAndUpdate({ uuid: uuid }, { token: null, user: null })
    .then(device => User.findByIdAndUpdate(userId, { $pull: { devices: device._id } }))
    .then(res.end())
    .catch(err => {
      logger.error(err);
      return res.status(500).send({ message: translate['system.server.error'] });
    });
};

exports.resetPassword = async function (req, res) {
  try {
    req.checkBody('email', translate['user.resetpassword.email.required']).notEmpty();
    var errors = req.validationErrors();
    if (errors) return res.status(422).send(helper.getMessage(errors));
    const email = req.body.email;
    const email_lower = trimAndLowercase(email);

    let user = await User.findOne({ email_lower, deleted: false, roles: constants.ROLE.EMPLOYEE });
    if (!user) {
      return res.status(422).send({
        message: translate['user.resetpassword.user.null']
      });
    }

    // if (user.status === constants.USER_STATUS.PENDING) {
    //   return res.status(422).send({
    //     message: translate['user.resetpassword.unconfirmed_account.error']
    //   });
    // }

    const newPassword = await User.generateRandomPassphrase();
    user.password = newPassword;
    user.is_required_update_password = false;
    await user.save();

    mailerServerUtils.sendMailResetPassForUser(email_lower, newPassword, user.name);

    let message = translate['user.resetpassword.message.sent_mail_success'];
    message = message.replace('{0}', user.email);
    return res.status(200).send({ message });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({
      message: translate['system.server.error']
    });
  }
};

exports.changePassword = function (req, res) {
  req.checkBody('password', translate['user.changepassword.password.required']).notEmpty();
  req.checkBody('new_password', translate['user.changepassword.newpassword.required']).notEmpty();
  req.checkBody('confirm_password', translate['user.changepassword.notmatch']).equals(req.body.new_password);

  var errors = req.validationErrors();
  if (errors) return res.status(422).send(helper.getMessage(errors));
  var password = req.body.password;
  var new_password = req.body.new_password;
  var user = req.user;
  var device = req.device;
  User.findOne({ _id: user._id, deleted: false }, function (err, user) {
    if (err) {
      logger.error(err);
      return res.status(422).send({
        message: translate['system.server.error']
      });
    }

    if (!user || user.deleted) {
      return res.status(422).send({
        message: translate['user.changepassword.user.null']
      });
    }
    if (user.authenticate(password)) {
      var new_token;
      changePass(user, device, new_password)
        .then(function (rs) {
          new_token = rs.token;
          return res.json({ token: new_token });
        })
        .catch(function (err) {
          logger.error(err);
          return res.status(422).send({
            message: translate['system.server.error']
          });
        });
    } else {
      return res.status(422).send({
        message: translate['user.changepassword.password.illegal']
      });
    }
  });
};

/**
 * Check Token
* @function アカウント認証
 * @returns { results: object user }
 */
exports.verify_token = function (req, res) {
  var user = req.user;
  var device = req.device;
  var os = req.headers.os || '';
  var version = req.headers.version || '';
  User.findByIdAndUpdate(user._id, { last_login: Date.now() })
    .then(() => Device.findByIdAndUpdate(device._id, { time: Date.now(), version: version, os: os }))
    .then(() => Config.findOne())
    .then(conf => {
      if (!conf) {
        return res.jsonp({ user: pickUser(user), device: device, version: '' });
      } else {
        return res.jsonp({ user: pickUser(user), device: device, version: conf.version });
      }
    })
    .catch(err => {
      logger.error(err);
      return res.jsonp({ user: pickUser(user), device: device, version: '' });
    });
};

/**
* @function システムデータ
* @returns { 200 }
*/
exports.setting = function (req, res) {
  req.checkBody('receive_notification', translate['user.settings.receive_notification.required']).notEmpty();
  var errors = req.validationErrors();
  if (errors) return res.status(422).send(helper.getMessage(errors));

  var userId = req.user._id;
  User.findOne({ _id: userId, deleted: false })
    .then(user => {
      if (!user)
        return res.status(403).send({ message: translate['user.account_not_found'] });

      user.settings = {
        receive_notification: req.body.receive_notification
      };
      return user.save();
    })
    .then(() => {
      return res.end();
    })
    .catch(err => {
      logger.error(err);
      return res.status(500).send({ message: translate['system.server.error'] });
    });
};

exports.profile = async function (req, res) {
  try {
    const userId = req.user._id;
    let user = await User.findOne({ _id: userId, deleted: false })
      .populate({
        path: 'devices',
        select: 'code'
      });

    if (!user) {
      return res.status(403).send({ message: translate['user.account_not_found'] });
    }

    let device = user.devices && user.devices[0];
    let returnData = pickUser(user);
    returnData.device = device;

    return res.jsonp(returnData);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.update_profile = async function (req, res) {
  try {
    let user = await User.findOne({ _id: req.user._id, deleted: false });
    if (!user) {
      return res.status(403).send({ message: translate['user.account_not_found'] });
    }

    if (req.body.nickname) {
      const isExistingNickname = await User.findOne({ nickname: req.body.nickname, deleted: false, _id: { $ne: user._id } });
      if (isExistingNickname) {
        return res.status(403).send({ message: translate['user.update_profile.nickname.exist'] });
      }
    }

    user = _.extend(user, req.body);
    await user.save();

    return res.json(pickUser(user));
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

/**
* @function システムデータ
* @returns { config: object, version: string }
*/
exports.config = function (req, res) {
  var setting;
  Config.findOne().lean().exec(function (err, _setting) {
    if (err) {
      logger.error(err);
      return res.status(422).send({ message: translate['system.server.error'] });
    }
    delete _setting.point_setting;
    delete _setting.rank_setting;

    setting = _setting;
    setting = JSON.parse(JSON.stringify(setting));

    if (setting.term) {
      setting.term = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="overflow-x: hidden;"> 
          ${setting.term}
        </body>
      </html>
      `;
    }
    if (setting.policy) {
      setting.policy = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="overflow-x: hidden;"> 
          ${setting.policy}
        </body>
      </html>
      `;
    }
    res.jsonp({
      config: setting, version: setting.version,
      genders: master_data.masterdata.genders,
      prefectures: master_data.masterdata.prefectures,
      allow_fix_step: setting && setting.allow_fix_step,
      fix_user: setting && setting.fix_user,
      fix_all_user: setting && setting.fix_all_user,
      fix_key: setting && setting.fix_key
    });
  });
};

/**
* @function プッシュ通知ID変更
* @param registrationId
* @param userId
* @param uuid
* @returns
*/
exports.notif_registrationId = function (req, res) {
  req.checkBody('uuid', translate['user.registration.uuid.required']).notEmpty();

  var userId = req.user._id;
  var uuid = req.body.uuid;
  var registrationId = req.body.registrationId || '';
  Device.findOneAndUpdate({ user: userId, uuid: uuid }, { registrationId: registrationId }).exec();
  return res.end();
};
/**
* @function プッシュ通知クリア
* @returns
*/
exports.notif_clear = function (req, res) {
  var user = req.user;
  var device = req.device;
  if (!user || !user._id || !user.roles || user.roles.length <= 0)
    return res.status(400).send({ message: translate['system.server.error'] });

  if (!device || !device._id)
    return res.status(400).send({ message: translate['system.server.error'] });

  Device.findByIdAndUpdate(device._id, { notification_count: 0 }).exec();
  return res.end();
};

/**
* @function プッシュ通知加減
* @returns
*/
exports.notif_decrease = function (req, res) {
  var user = req.user;
  var device = req.device;
  if (!user || !user._id || !user.roles || user.roles.length <= 0)
    return res.status(400).send({ message: translate['system.server.error'] });

  if (!device || !device._id)
    return res.status(400).send({ message: translate['system.server.error'] });

  Device.findByIdAndUpdate(device._id, { $inc: { notification_count: -1 } }).exec();

  return res.end();
};

exports.update_email = async function (req, res) {
  try {
    const { email } = req.body;
    let user = await User.findOne({ _id: req.user._id, deleted: false });
    if (!user) {
      return res.status(403).send({ message: translate['user.account_not_found'] });
    }
    if (!email) {
      return res.status(403).send({ message: translate['system.server.error'] });
    }

    const email_lower = trimAndLowercase(email);
    const isEmailExisting = await User.findOne({ email_lower, _id: { $ne: user._id }, deleted: false }).select('_id').lean();
    if (isEmailExisting) {
      return res.status(403).send({ message: translate['user.update_email.email.error.exist'] });
    }

    user.tmp_email = email;

    const token_email = User.createToken();
    user.token_update_email = token_email;
    user.token_update_email_expire_at = new Date(new Date().getTime() + ONE_DAY_IN_MILLISECOND);

    await user.save();

    await mailerServerUtils.sendMailUpdatedEmail(email_lower, user.name, token_email);

    let message = translate['user.update_email.message.sent_mail_success'];
    message = message.replace('{0}', email_lower);
    return res.status(200).send({ message });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.home_info = async function (req, res) {
  try {
    const today = moment();
    const dateKey = helper.getYYYYMMDDString(today);
    let [user, points, configObject] = await Promise.all([
      User.findById(req.user._id)
        .select('-roles -password -salt -devices -token -settings -last_login')
        .populate({ path: 'company', select: 'ranking_to_show' })
        .lean(),
      Point.find({ deleted: false, user: req.user._id, expire: { $gt: new Date() } }),
      Config.findOne({}).select('days_show_finished_event')
    ]);

    // Calculate totalPointsOfUser
    if (user) {
      const totalPointsOfUser = points.reduce((sum, item) => {
        return sum + item.points;
      }, 0);
      user.totalPointsOfUser = totalPointsOfUser;
    }

    // return latest finished event if admin set days_show_finished_event
    // and do not have any events preparing or opening
    if (user && !user.comproject_joining && configObject.days_show_finished_event) {
      const comprojectId = await helper.getComprojectJoiningId(req.user);
      if (comprojectId) {
        user.comproject_joining = comprojectId;
      }
    }

    let returnData = {};
    if (user && user.comproject_joining) {
      user.isJoiningEvent = true;

      let [comproject, dailyRecord] = await Promise.all([
        Comproject.findById(user.comproject_joining).populate([
          { path: 'project' },
          { path: 'municipality', select: 'name prefecture' },
          { path: 'event', select: 'current_total max_donation_amount' }
        ]).lean(),
        Daily.findOne({ deleted: false, user: req.user._id, date: dateKey }).lean()
      ]);
      const eventId = comproject && comproject.event;
      let [participantsOfCompany, numberOfComprojects] = await Promise.all([
        Participant.find({ deleted: false, event: eventId, company: req.user.company }),
        Comproject.countDocuments({ deleted: false, event: eventId })
      ]);
      user.isShowViewOtherProjects = numberOfComprojects > 1;

      if (comproject) {
        const participantsOfCompanyOfComproject = participantsOfCompany.filter(participant => {
          return participant.comproject.toString() === comproject._id.toString();
        });
        comproject.numberOfJoinedEmployeesSameGroup = participantsOfCompanyOfComproject.length;
        const totalAmount = participantsOfCompanyOfComproject.reduce((sum, item) => {
          return sum + item.amount;
        }, 0);
        comproject.totalAmount = comproject.status === constants.EVENT_STATUS.FINISHED ? comproject.total : totalAmount;
      }

      const participantOfUser = participantsOfCompany.find(item => item.user && item.user.toString() === req.user._id.toString());
      if (participantOfUser) {
        user.totalStepsOfEvent = simulationServerController.roundSteps(participantOfUser.steps);
        user.totalAmountOfEvent = participantOfUser.amount;
        user.totalPointsOfEvent = participantOfUser.point;
        user.rankOfEvent = participantOfUser.rank;
        user.joinedEventAt = participantOfUser.created;

        if (comproject) {
          const numberOfDays = Math.ceil((new Date(comproject.end).getTime() - new Date(participantOfUser.created).getTime()) / constants.DAY_IN_MILLISECONDS);
          user.totalTargetStepsOfEvent = numberOfDays * (user.target_steps_per_day || 0);
        }
      }

      returnData.event = comproject;

      if (dailyRecord && dailyRecord.events) {
        let eventsObject = dailyRecord.events;
        Object.keys(eventsObject).forEach(comprojectId => {
          if (comprojectId === user.comproject_joining.toString()) {
            dailyRecord.steps_event = dailyRecord.events[comprojectId] ? dailyRecord.events[comprojectId].steps : 0;
            dailyRecord.steps_event = simulationServerController.roundSteps(dailyRecord.steps_event);

            const isSetHeightAndWeight = user && user.height && user.weight;
            if (isSetHeightAndWeight) {
              dailyRecord.calories_event = dailyRecord.events[comprojectId] ? dailyRecord.events[comprojectId].calories : 0;
            } else {
              dailyRecord.calories_event = null;
            }
          }
        });

        delete dailyRecord.events;
      }
      returnData.daily = dailyRecord;

      // Hard to fix issue
      returnData.numberOfEmployees = participantsOfCompany.length;

      // Check max donation amount of event
      user.isMaxPoint = false;
      user.isShowGrowthRateRanking = comproject && helperServer.isEventStartedOver7Days(comproject.start);
      user.isShowDepartmentRanking = true;
      if (user.company && user.company.ranking_to_show) {
        user.isShowDepartmentRanking = user.company.ranking_to_show === constants.COMPANY_SETTING_RANKING.DEPARTMENT_RANKING;
      }

      // CR 31/01/2022: continue increase point
      // if (comproject && comproject.event && comproject.event.max_donation_amount) {
      //   user.isMaxPoint = comproject.event.max_donation_amount && comproject.event.current_total >= comproject.event.max_donation_amount;
      // }
    }

    if (user) {
      user.isShowContactButton = Boolean(req.user.comproject_joining || (points.length > 0));
    }

    returnData.user = user;
    return res.json(returnData);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

function generateRandomString(length = 10) {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let string = '';
  for (var i = 0; i < length; i++) {
    string += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return string;
}

exports.updateDailyActivity = async function (req, res) {
  let session = null;
  try {
    // 1. update or create daily record
    // 2. update participant if joining comproject
    // 3. update last_get_data_date in user table
    // 4. recalculate rank in participant & rank in subsidiary-rank table
    const user = req.user;
    let dailyData = req.body;
    if (!dailyData || dailyData.length === 0) {
      return res.status(422).send({ message: translate['system.missing_params.error'] });
    }

    // order to get records with more steps_event
    dailyData = _.sortBy(dailyData, ['steps_event'], ['asc']);

    dailyData = dailyData.map(item => {
      item.key = generateRandomString();
      return item;
    });

    let dailyDataToCheck = JSON.parse(JSON.stringify(dailyData));
    dailyData = dailyData.map(item => {
      const dailyRecord = dailyDataToCheck.find(element => {
        return item.key !== element.key && element.start_time && element.end_time && item.start_time && element.end_time && element.start_time.toString() === item.start_time.toString()
          && element.end_time.toString() === item.end_time.toString();
      });
      item.invalid_data = Boolean(dailyRecord);

      if (dailyRecord) {
        dailyDataToCheck = dailyDataToCheck.filter(e => e.key !== item.key);
      }

      return item;
    });

    // Filter dailyData by start_time and end_time
    const stepHistoryPromises = dailyData.map(item => {
      return isHasValidStepHistoryInPeriod(item.start_time, item.end_time, user._id);
    });
    const stepHistories = await Promise.all(stepHistoryPromises);
    dailyData = dailyData.map((item, index) => {
      item.invalid_data = (item.start_time && item.end_time && (stepHistories[index] || item.start_time.toString() === item.end_time.toString())) || item.invalid_data;
      return item;
    });
    const dailyDataStepHistory = JSON.parse(JSON.stringify(dailyData));
    dailyData = dailyData.filter(item => {
      return !item.invalid_data;
    });

    dailyData = dailyData.map(item => {
      item.calories = simulationServerController.calculateCalories(user.height, user.weight, item.steps);
      if (item.steps_event) {
        item.calories_event = simulationServerController.calculateCalories(user.height, user.weight, simulationServerController.roundSteps(item.steps_event));
      }
      return item;
    });

    session = await mongoose.startSession();
    session.startTransaction();

    const comprojectIdJoining = user.comproject_joining;
    let comproject;
    // 2
    if (comprojectIdJoining) {
      comproject = await Comproject.findById(comprojectIdJoining)
        .populate({ path: 'event' });
      if (isEventOpening(comprojectIdJoining, comproject)) {
        const numberOfStepsEventIncrement = dailyData.reduce((sum, item) => {
          return sum + (item.steps_event || 0);
        }, 0);

        let isEventFloating = comproject.event.type === constants.EVENT_TYPE.FLOATING;
        let numberOfAmountIncrement = isEventFloating ? simulationServerController.convertStepsToAmounts(simulationServerController.roundSteps(numberOfStepsEventIncrement), comproject.aps) : 0;
        let numberOfPointIncrement = simulationServerController.convertStepsToPoints(simulationServerController.roundSteps(numberOfStepsEventIncrement), comproject.pps);

        // CR 31/1/2021: currentTotalOfEvent > max_donation_amount : stop increase amount, but points still increase
        if (isEventFloating && isCheckMaxDonationAmount && comproject.event.max_donation_amount) {
          const currentTotalOfEvent = comproject.event.current_total || 0;
          if (currentTotalOfEvent < comproject.event.max_donation_amount) {
            numberOfAmountIncrement = currentTotalOfEvent + numberOfAmountIncrement <= comproject.event.max_donation_amount ? numberOfAmountIncrement : (comproject.event.max_donation_amount - currentTotalOfEvent);
            // const steps = simulationServerController.convertAmountsToSteps(numberOfAmountIncrement, comproject.aps);
            // numberOfPointIncrement = simulationServerController.convertStepsToPoints(simulationServerController.roundSteps(steps), comproject.pps);
          } else {
            numberOfAmountIncrement = 0;
            // numberOfPointIncrement = 0;
          }
        }

        await Participant.updateOne(
          { user: user._id, comproject: comproject._id, deleted: false },
          { $inc: { steps: numberOfStepsEventIncrement, point: numberOfPointIncrement, amount: numberOfAmountIncrement } },
          { session }
        );
        await Event.updateOne(
          { _id: comproject.event._id },
          { $inc: { current_total: numberOfAmountIncrement } },
          { session }
        );

        // Save step history
        const createStepHistoryPromises = dailyDataStepHistory.map(item => {
          let stepHistory = item;
          stepHistory.user = user._id;
          stepHistory.event = comproject.event._id;
          return StepHistory.create(stepHistory);
        });
        Promise.all(createStepHistoryPromises);
      }
    }

    // 3
    const updateDailyPromises = dailyData.map(item => {
      let dailyConditions = { user: user._id, date: item.date, date_query: new Date(item.date).setHours(12, 0, 0, 0), deleted: false };
      let dailyUpdate = { $inc: { steps: item.steps, calories: item.calories }, user: user._id, updated: new Date() };
      if (isEventOpening(comprojectIdJoining, comproject)) {
        dailyUpdate.$inc[`events.${comprojectIdJoining.toString()}.steps`] = item.steps_event || 0;
        dailyUpdate.$inc[`events.${comprojectIdJoining.toString()}.calories`] = item.calories_event || 0;
      }
      return Daily.findOneAndUpdate(
        dailyConditions,
        dailyUpdate,
        { setDefaultsOnInsert: true, new: true, upsert: true },
      ).session(session);
    });
    await Promise.all(updateDailyPromises);

    // 1
    await User.updateOne({ _id: user._id, deleted: false }, { last_get_data_date: new Date() }, { session });

    await session.commitTransaction();
    session.endSession();

    try {
      if (isEventOpening(comprojectIdJoining, comproject)) {
        // 4
        rankServerController.recalculateRanksForComproject(comprojectIdJoining, user.company);
      }
    } catch (error) {
      logger.error(error);
    }

    return res.json(true);
  } catch (error) {
    abortTransaction();
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }

  function isEventOpening(comprojectIdJoining, comproject) {
    return comprojectIdJoining && comproject && comproject.event && comproject.event.status === constants.EVENT_STATUS.OPENING;
  }

  function abortTransaction() {
    if (session) {
      session.abortTransaction().then(() => {
        session.endSession();
      });
    }
  }
};

async function isHasValidStepHistoryInPeriod(start_time, end_time, userId) {
  try {
    if (!start_time || !end_time || !userId) {
      return false;
    }
    let condition = {
      $or: [
        { start_time: { $gt: start_time, $lt: end_time } },
        { end_time: { $gt: start_time, $lt: end_time } },
        { $and: [{ start_time: { $lt: start_time } }, { end_time: { $gt: end_time } }] },
        { $and: [{ start_time: { $eq: start_time } }, { end_time: { $eq: end_time } }] }
      ],
      deleted: false,
      invalid_data: false,
      user: userId
    };
    const stepHistory = await StepHistory.findOne(condition).select('_id').lean();
    return Boolean(stepHistory);
  } catch (error) {
    logger.error(error);
    return false;
  }
}

exports.updateDailyActivityV2 = async function (req, res) {
  let session = null;
  try {
    // 1. update or create daily record
    // 2. update participant if joining comproject
    // 3. update last_get_data_date in user table if have
    // 4. recalculate rank in participant & rank in subsidiary-rank table
    const user = req.user;
    let { data, last_update_time } = req.body;
    let dailyData = data;
    if (!dailyData || dailyData.length === 0) {
      return res.status(422).send({ message: translate['system.missing_params.error'] });
    }

    // order to get records with more steps_event
    dailyData = _.sortBy(dailyData, ['steps_event'], ['asc']);

    dailyData = dailyData.map(item => {
      item.key = generateRandomString();
      return item;
    });

    let dailyDataToCheck = JSON.parse(JSON.stringify(dailyData));
    dailyData = dailyData.map(item => {
      const dailyRecord = dailyDataToCheck.find(element => {
        return item.key !== element.key && element.start_time && element.end_time && item.start_time && element.end_time && element.start_time.toString() === item.start_time.toString()
          && element.end_time.toString() === item.end_time.toString();
      });
      item.invalid_data = Boolean(dailyRecord);

      if (dailyRecord) {
        dailyDataToCheck = dailyDataToCheck.filter(e => e.key !== item.key);
      }

      return item;
    });

    // Filter dailyData by start_time and end_time
    const stepHistoryPromises = dailyData.map(item => {
      return isHasValidStepHistoryInPeriod(item.start_time, item.end_time, user._id);
    });
    const stepHistories = await Promise.all(stepHistoryPromises);
    dailyData = dailyData.map((item, index) => {
      item.invalid_data = item.invalid_data || (item.start_time && item.end_time && (stepHistories[index] || item.start_time.toString() === item.end_time.toString()));
      return item;
    });
    const dailyDataStepHistory = JSON.parse(JSON.stringify(dailyData));
    dailyData = dailyData.filter(item => {
      return !item.invalid_data;
    });

    dailyData = dailyData.map(item => {
      item.calories = simulationServerController.calculateCalories(user.height, user.weight, item.steps);
      if (item.steps_event) {
        item.calories_event = simulationServerController.calculateCalories(user.height, user.weight, simulationServerController.roundSteps(item.steps_event));
      }
      return item;
    });

    session = await mongoose.startSession();
    session.startTransaction();

    const comprojectIdJoining = user.comproject_joining;
    let comproject;
    // 2
    if (comprojectIdJoining) {
      comproject = await Comproject.findById(comprojectIdJoining)
        .populate({ path: 'event' });
      if (isEventOpening(comprojectIdJoining, comproject)) {
        const numberOfStepsEventIncrement = dailyData.reduce((sum, item) => {
          return sum + (item.steps_event || 0);
        }, 0);

        let isEventFloating = comproject.event.type === constants.EVENT_TYPE.FLOATING;
        let numberOfAmountIncrement = isEventFloating ? simulationServerController.convertStepsToAmounts(simulationServerController.roundSteps(numberOfStepsEventIncrement), comproject.aps) : 0;
        let numberOfPointIncrement = simulationServerController.convertStepsToPoints(simulationServerController.roundSteps(numberOfStepsEventIncrement), comproject.pps);

        // CR 31/1/2021: currentTotalOfEvent > max_donation_amount : stop increase amount, but points still increase
        if (isEventFloating && isCheckMaxDonationAmount && comproject.event.max_donation_amount) {
          const currentTotalOfEvent = comproject.event.current_total || 0;
          if (currentTotalOfEvent < comproject.event.max_donation_amount) {
            numberOfAmountIncrement = currentTotalOfEvent + numberOfAmountIncrement <= comproject.event.max_donation_amount ? numberOfAmountIncrement : (comproject.event.max_donation_amount - currentTotalOfEvent);
            // const steps = simulationServerController.convertAmountsToSteps(numberOfAmountIncrement, comproject.aps);
            // numberOfPointIncrement = simulationServerController.convertStepsToPoints(simulationServerController.roundSteps(steps), comproject.pps);
          } else {
            numberOfAmountIncrement = 0;
            // numberOfPointIncrement = 0;
          }
        }

        await Participant.updateOne(
          { user: user._id, comproject: comproject._id, deleted: false },
          { $inc: { steps: numberOfStepsEventIncrement, point: numberOfPointIncrement, amount: numberOfAmountIncrement } },
          { session }
        );
        await Event.updateOne(
          { _id: comproject.event._id },
          { $inc: { current_total: numberOfAmountIncrement } },
          { session }
        );

        // Save step history
        const createStepHistoryPromises = dailyDataStepHistory.map(item => {
          let stepHistory = item;
          stepHistory.user = user._id;
          stepHistory.event = comproject.event._id;
          return StepHistory.create(stepHistory);
        });
        Promise.all(createStepHistoryPromises);
      }
    }

    // 3
    const updateDailyPromises = dailyData.map(item => {
      let dailyConditions = { user: user._id, date: item.date, date_query: new Date(item.date).setHours(12, 0, 0, 0), deleted: false };
      let dailyUpdate = { $inc: { steps: item.steps, calories: item.calories }, user: user._id, updated: new Date() };
      if (isEventOpening(comprojectIdJoining, comproject)) {
        dailyUpdate.$inc[`events.${comprojectIdJoining.toString()}.steps`] = item.steps_event || 0;
        dailyUpdate.$inc[`events.${comprojectIdJoining.toString()}.calories`] = item.calories_event || 0;
      }
      return Daily.findOneAndUpdate(
        dailyConditions,
        dailyUpdate,
        { setDefaultsOnInsert: true, new: true, upsert: true },
      ).session(session);
    });
    await Promise.all(updateDailyPromises);

    // 1
    if (last_update_time) {
      await User.updateOne({ _id: user._id, deleted: false }, { last_get_data_date: new Date(last_update_time) }, { session });
    }

    await session.commitTransaction();
    session.endSession();

    try {
      if (isEventOpening(comprojectIdJoining, comproject)) {
        // 4
        rankServerController.recalculateRanksForComproject(comprojectIdJoining, user.company);
      }
    } catch (error) {
      logger.error(error);
    }

    return res.json(true);
  } catch (error) {
    abortTransaction();
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }

  function isEventOpening(comprojectIdJoining, comproject) {
    return comprojectIdJoining && comproject && comproject.event && comproject.event.status === constants.EVENT_STATUS.OPENING;
  }

  function abortTransaction() {
    if (session) {
      session.abortTransaction().then(() => {
        session.endSession();
      });
    }
  }
};

exports.getDailyActivity = async function (req, res) {
  try {
    let { start, end } = req.body;
    const comproject_joining = await helper.getComprojectJoiningId(req.user);
    if (!comproject_joining || !start || !end) {
      return res.json([]);
    }
    const comproject = await Comproject.findById(comproject_joining).select('start end').lean();
    if (!comproject) {
      return res.json([]);
    }

    start = new Date(start).setHours(0, 0, 0, 0);
    end = new Date(end).setHours(23, 59, 59, 0);
    let conditions = { deleted: false, user: req.user._id, $and: [] };
    conditions.$and.push({ date_query: { $gte: start } });
    conditions.$and.push({ date_query: { $lte: end } });

    const dailies = await Daily.find(conditions).lean();
    let result = [];
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      const dateKey = helper.getYYYYMMDDString(day);
      const daily = dailies.find(item => item.date === dateKey);
      let stepsEvent = daily && daily.events && daily.events[comproject_joining.toString()] ? daily.events[comproject_joining.toString()].steps : 0;
      stepsEvent = simulationServerController.roundSteps(stepsEvent);
      result.push(stepsEvent);
    }

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.getUnexpiredPoints = async function (req, res) {
  try {
    const userId = req.user._id;
    const points = await Point.find({ user: userId, deleted: false, expire: { $gt: new Date() } })
      .populate({ path: 'municipality', select: 'name' }).sort('expire').lean();
    return res.json(points);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.getPointHistories = async function (req, res) {
  try {
    const userId = req.user._id;
    let pointLogs = await PointLog.find({ user: userId, deleted: false }).populate([
      { path: 'project', select: 'name' },
      { path: 'municipality', select: 'name' }
    ]).sort('-created').lean();

    pointLogs = pointLogs.map(item => {
      switch (item.type) {
        case constants.POINT_LOG_TYPE.ACQUISITION:
          item.text = `${item.municipality && item.municipality.name || ''} ${item.project && item.project.name || ''}`;
          break;
        case constants.POINT_LOG_TYPE.USE:
          item.text = `${item.municipality && item.municipality.name || ''}ふるさと納税`;
          break;
        case constants.POINT_LOG_TYPE.EXPIRATION:
          item.text = `${item.municipality && item.municipality.name || ''}ポイント失効`;
          break;
        default:
          break;
      }

      delete item.project;
      delete item.municipality;
      return item;
    });
    return res.json(pointLogs);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.generateTokenEcSite = async function (req, res) {
  try {
    const userId = req.user._id;
    const token_ec_site = User.createToken();
    await User.updateOne({ _id: userId }, { token_ec_site });

    return res.json(token_ec_site);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.getStepHistories = async function (req, res) {
  try {
    let { from, to } = req.body;
    const userId = req.user._id;
    if (!userId || !from || !to) {
      return res.json([]);
    }
    from = moment(from).startOf('day');
    to = moment(to).endOf('day');

    const result = await StepHistory.find({
      user: userId,
      $and: [
        { start_time: { $gte: from } },
        { start_time: { $lte: to } }
      ]
    }).lean();

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.removeDupSteps = async function (req, res) {
  try {
    const eventId = req.body.eventId;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(422).send({ message: 'Event not found!' });
    }

    let aggregate = [
      {
        $match: {
          start_time: { $gte: event.start },
          end_time: { $lte: event.end },
          // start_time: { $ne: null },
          // end_time: { $ne: null },
          steps_event: { $gt: 0 },
          invalid_data: false
        }
      },
      {
        $group: {
          _id: { user: '$user', start_time: '$start_time', end_time: '$end_time' },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: { $ne: null }, count: { $gt: 1 }
        }
      },
      {
        $addFields: {
          user: '$_id.user',
          start_time: '$_id.start_time',
          end_time: '$_id.end_time'
        }
      }
    ];

    const result = await StepHistory.aggregate(aggregate);
    const stepHistoriesPromises = result.map(item => {
      return StepHistory.find({ user: item.user, start_time: item.start_time, end_time: item.end_time, invalid_data: false, steps: { $gt: 0 } })
        .populate({ path: 'user', select: 'height weight' })
        .lean();
    });

    const stepHistoriesResult = await Promise.all(stepHistoriesPromises);
    for (let i = 0; i < stepHistoriesResult.length; i++) {
      let stepHistories = stepHistoriesResult[i];
      stepHistories = _.sortBy(stepHistories, ['steps_event'], ['asc']);

      // Remove record of the end
      stepHistories.pop();

      for (let j = 0; j < stepHistories.length; j++) {
        const stepHistory = stepHistories[j];
        await updateEventData(event, stepHistory);
      }
    }

    return res.json(stepHistoriesResult);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.contact = async function (req, res) {
  try {
    const userId = req.user._id;
    const companyId = req.user.company;
    const content = req.body.content;
    if (!userId || !companyId || !content) {
      return res.status(422).send({ message: translate['system.missing_params.error'] });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(422).send({ message: translate['system.missing_params.error'] });
    }

    const companyName = helper.parseCompanyName(company.kind, company.name);
    mailerServerUtils.sendMailContactFromUsers({ companyName, userName: req.user.name, content, userEmail: req.user.email });

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.restoreDepartmentForUser = async function (req, res) {
  try {
    let users = await User.find({ deleted: false, roles: constants.ROLE.EMPLOYEE, department: { $ne: null }, e_department: null });
    users = users.filter(item => item.department);

    if (!users || users.length === 0) {
      return res.status(422).send({ message: 'No more data to restore!' });
    }

    for (let i = 0; i < users.length; i++) {
      let user = users[i];
      let [department, numberOfDepartment] = await Promise.all([
        Department.findOne({ deleted: false, company: user.company, subsidiary: user.subsidiary, name: user.department }),
        Department.countDocuments({ deleted: false, company: user.company, subsidiary: user.subsidiary })
      ]);
      if (!department) {
        department = new Department({ company: user.company, subsidiary: user.subsidiary, name: user.department, code: generateDepartmentCode(numberOfDepartment) });
        await department.save();
      }

      user.e_department = department._id;
      await user.save();
    }

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }

  function generateDepartmentCode(currentNumberOfDepartment) {
    if (currentNumberOfDepartment.toString().length >= 4) {
      return currentNumberOfDepartment + 1;
    }

    currentNumberOfDepartment += 1;
    currentNumberOfDepartment = currentNumberOfDepartment.toString();
    const padding = (target) => ('000' + target).slice(-3);
    return padding(currentNumberOfDepartment);
  }
};

async function updateEventData(event, stepHistory) {
  let session = null;
  try {
    const user = stepHistory.user;
    const participant = await Participant.findOne({ user: user._id, event: event._id }).select('comproject').lean();
    if (!participant) {
      return false;
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const steps = stepHistory.steps;
    const steps_event = stepHistory.steps_event;

    const calories = simulationServerController.calculateCalories(user.height, user.weight, steps);
    const caloriesEvent = simulationServerController.calculateCalories(user.height, user.weight, steps_event);
    const amount = simulationServerController.convertStepsToAmounts(steps_event, event.aps);
    const points = simulationServerController.convertStepsToPoints(steps_event, event.pps);

    await Participant.updateOne({ _id: participant._id }, { $inc: { steps: -steps_event, point: -points, amount: -amount } }, { session });
    await Event.updateOne({ _id: event._id }, { $inc: { current_total: -amount } }, { session });

    let dailyUpdate = { $inc: { steps: -steps, calories: -calories } };
    dailyUpdate.$inc[`events.${participant.comproject.toString()}.steps`] = -steps_event || 0;
    dailyUpdate.$inc[`events.${participant.comproject.toString()}.calories`] = -caloriesEvent || 0;
    await Daily.updateOne({ user: user._id, date: stepHistory.date, deleted: false }, dailyUpdate, { session });

    await StepHistory.updateOne({ _id: stepHistory._id }, { invalid_data: true }, { session });

    await session.commitTransaction();
    session.endSession();
    return true;
  } catch (error) {
    abortTransaction();
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

// PRIVATE
function isEmployee(roles) {
  if (roles && roles[0] && roles.indexOf(constants.ROLE.EMPLOYEE) >= 0) {
    return true;
  }
  return false;
}

function changePass(user, device, new_password, status) {
  return new Promise((resolve, reject) => {
    user.password = new_password;
    user.is_required_update_password = false;

    user.save(function (err) {
      if (err) {
        return reject(err);
      }

      Device.findById(device._id).exec(function (err, _device) {
        if (err) {
          return reject(err);
        }
        _device.token = Device.createToken();
        _device.save(function (err, rs) {
          if (err) {
            return reject(err);
          }
          resolve(rs);
        });
      });
    });
  });
}

function pickUser(user) {
  if (!user) {
    return {};
  }
  user = JSON.parse(JSON.stringify(user));
  delete user.password;
  delete user.salt;
  delete user.token;
  delete user.token_expire_at;
  delete user.token_update_email;
  delete user.token_update_email_expire_at;
  delete user.devices;

  return user;
}

function trimAndLowercase(data) {
  if (!data) {
    return '';
  }

  data = data.trim();
  data = data && data.toLowerCase();

  return data;
}
