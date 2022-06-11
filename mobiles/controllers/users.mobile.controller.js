'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  moment = require('moment-timezone'),
  path = require('path'),
  helper = require(path.resolve('./mobiles/controllers/help.mobile.controller')),
  logger = require(path.resolve('./mobiles/controllers/logger.mobile.controller')),
  User = mongoose.model('User'),
  Device = mongoose.model('Device'),
  Config = mongoose.model('Config'),
  Municipality = mongoose.model('Municipality'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  mailerServerUtils = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  master_data = require(path.resolve('./config/lib/master-data')),
  translate = require(path.resolve('./config/locales/mobile/ja.json'));

moment.tz.setDefault('Asia/Tokyo');
moment.locale('ja');

exports.getConfiguration = function (req, res) {
  var setting;
  Config.findOne().lean().exec(function (err, _setting) {
    if (err) {
      logger.error(err);
      return res.status(422).send({ message: translate['system.server.error'] });
    }

    setting = _setting;
    setting = JSON.parse(JSON.stringify(setting));

    res.jsonp({
      config: setting, version: setting.version,
      prefectures: master_data.masterdata.prefectures,
      sending_application_forms: master_data.masterdata.sending_application_forms,
      application_sexes: master_data.masterdata.application_sexes,
      simulation_donation: master_data.masterdata.simulation_donation
    });
  });
};

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
      await User.findByIdAndUpdate(user._id, { last_login: Date.now(), $inc: { login_times: 1 }, devices: [device._id] }, { new: true });
      device = JSON.parse(JSON.stringify(device));
      delete device.info;
      const returnUser = pickUser(user);
      return { success: true, data: { user: returnUser, location: user.location, municipality: user.municipality, device: device, version: config && config.version || '' } };
    } catch (error) {
      logger.error(error);
      throw error;
    }

    async function verifyEmailAndPassword(email, password) {
      const email_lower = trimAndLowercase(email);
      const user = await User.findOne({ email_lower, roles: constants.ROLE.LOCATION, deleted: false }).populate([{ path: 'location' }, { path: 'municipality' }]);

      if (!user) {
        return { success: false, message: translate['user.signin.user.null'] };
      }

      if (!user.authenticate(password))
        return { success: false, message: translate['user.signin.user.wrong'] };

      return { success: true, user };
    }

    async function createDevice(deviceData) {
      let device = new Device(deviceData);
      await device.save();
      return device;
    }
  }
};
exports.signout = async function (req, res) {
  try {
    req.checkBody('uuid', translate['user.signout.uuid.required']).notEmpty();
    req.checkBody('password', translate['user.signin.password.required']).notEmpty();
    var errors = req.validationErrors();
    if (errors)
      return res.status(403).send(helper.getMessage(errors));
    const userId = req.user._id;
    const { uuid, password } = req.body;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(422).send({ message: translate['user.account_not_found'] });
    }
    if (!user.authenticate(password)) {
      return res.status(422).send({ message: translate['user.signout.error.password_invalid'] });
    }

    const device = await Device.findOneAndUpdate({ uuid: uuid }, { token: null, user: null });
    if (device) {
      await User.findByIdAndUpdate(userId, { $pull: { devices: device._id } });
    }

    return res.end();
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.resetPassword = async function (req, res) {
  try {
    req.checkBody('email', translate['user.resetpassword.email.required']).notEmpty();
    var errors = req.validationErrors();
    if (errors) return res.status(422).send(helper.getMessage(errors));
    const email = req.body.email;
    const email_lower = trimAndLowercase(email);

    let user = await User.findOne({ email_lower, deleted: false, roles: constants.ROLE.LOCATION });
    if (!user) {
      return res.status(422).send({
        message: translate['user.resetpassword.user.null']
      });
    }

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

exports.notif_registrationId = function (req, res) {
  req.checkBody('uuid', translate['user.registration.uuid.required']).notEmpty();

  var userId = req.user._id;
  var uuid = req.body.uuid;
  var registrationId = req.body.registrationId || '';
  Device.findOneAndUpdate({ user: userId, uuid: uuid }, { registrationId: registrationId }).exec();
  return res.end();
};
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

exports.home_info = async function (req, res) {
  try {
    const municipality = await Municipality.findById(req.user.municipality).lean();
    return res.json({ municipality });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

// PRIVATE
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
  delete user.location;

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
