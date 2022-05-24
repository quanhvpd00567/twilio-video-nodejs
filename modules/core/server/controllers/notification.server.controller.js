'use strict';

var _ = require('lodash'),
  __ = require('underscore'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Config = mongoose.model('Config'),
  Device = mongoose.model('Device'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  helper = require(path.resolve(
    './modules/core/server/controllers/help.server.controller'
  )),
  logger = require(path.resolve(
    './modules/core/server/controllers/logger.server.controller'
  )),
  FCM = require('fcm-node'),
  fcm = new FCM(config.firebase.apiKey);

exports.excute_text = function (device, title, body, data) {
  return new Promise(function (resolve, reject) {
    excuteText(device, title, body, data)
      .then(results => {
        return resolve(results);
      })
      .catch(err => {
        return reject(err);
      });
  });
};

exports.pushKey = function (userIds, notiId, title_key, body_key, data) {
  return new Promise(function (resolve, reject) {
    if (!data) {
      data = { notiId: notiId };
    } else {
      data.notiId = notiId;
    }
    findDevices(userIds)
      .then(devices => {
        var promises = [];
        if (!devices) return reject({ message: 'Devices not found.' });
        devices.forEach(device => {
          promises.push(excuteKey(device, title_key, body_key, data));
        });
        return Promise.all(promises);
      })
      .then(results => {
        return resolve(results);
      })
      .catch(err => {
        return reject(err);
      });
  });
};

exports.pushText = function (userIds, title, body, data) {
  return new Promise(function (resolve, reject) {
    data = !data ? {} : data;
    findDevices(userIds)
      .then(devices => {
        var promises = [];
        if (!devices) return reject({ message: 'Devices not found.' });
        devices.forEach(device => {
          promises.push(excuteText(device, title, body, data));
        });
        return Promise.all(promises);
      })
      .then(results => {
        return resolve(results);
      })
      .catch(err => {
        return reject(err);
      });
  });
};

exports.pushOne = function (registrationId, title_key, body_key, data, count) {
  return new Promise(function (resolve, reject) {
    var message = {
      to: registrationId,
      notification: {
        title_loc_key: title_key,
        body_loc_key: body_key,
        title: ' ',
        body: ' ',
        badge: count,
        sound: true,
        alert: true
      },
      apns: {
        payload: {
          aps: { badge: count }
        }
      },
      data: data
    };
    fcm.send(message, function (err, response) {
      if (err) return resolve(1); // Failed
      return resolve(2); // Success
    });
  });
};
exports.excute_key = function (device, title_key, body_key, data) {
  return new Promise(function (resolve, reject) {
    excuteKey(device, title_key, body_key, data)
      .then(results => {
        return resolve(results);
      })
      .catch(err => {
        return reject(err);
      });
  });
};
exports.setData = function (trouble, fromUserId, toUserIds) {
  var data = {};
  if (trouble) {
    data = _.pick(trouble, [
      '_id',
      'status',
      'done_status',
      'new_flow',
      'continuation_flow',
      'continuation_schedule_confirmed',
      'is_continuation'
    ]);
  }
  if (fromUserId) {
    data.fromUserId = fromUserId;
  }
  if (toUserIds) {
    data.toUserIds = toUserIds;
  }
  return data;
};

exports.executeSilentToMultiDevices = function (userIds, data) {
  return new Promise(function (resolve, reject) {
    // data = {user, device}
    data = !data ? {} : data;
    findDevices(userIds)
      .then(devices => {
        if (!devices || devices.length === 0) {
          return reject({ message: 'Devices not found.' });
        }

        const promises = devices.map(device => {
          // data.device = device;
          return excuteSilentToDevice(device, data);
        });
        return Promise.all(promises);
      })
      .then(results => {
        return resolve(results);
      })
      .catch(err => {
        return reject(err);
      });
  });
};

function excuteSilentToDevice(device, data) {
  return new Promise(function (resolve, reject) {
    const registrationId = device && device.registrationId;
    if (!registrationId) {
      return resolve(1);
    }

    const message = {
      registration_ids: [registrationId],
      priority: 'normal',
      'apns-priority': 5,
      content_available: true,
      data: data
    };

    logger.info('Silent Notification', message);
    logger.info(message);
    fcm.send(message, function (err, response) {
      if (err) {
        logger.error(err);
        return resolve(1); // Failed
      }
      logger.info(response);
      return resolve(2); // Failed
    });
  });
}

function findDevices(userIds) {
  return new Promise(function (resolve, reject) {
    Device.find({ user: { $in: userIds } }).exec((err, devices) => {
      if (err) return reject(err);
      return resolve(devices);
    });
  });
}
function excuteKey(device, title_key, body_key, data) {
  return new Promise(function (resolve, reject) {
    if (!device.registrationId || device.registrationId === '')
      return resolve(1);
    var count = device.notification_count + 1;
    var message = {
      to: device.registrationId,
      notification: {
        title_loc_key: title_key,
        body_loc_key: body_key,
        title: '',
        body: '',
        badge: count,
        sound: true,
        alert: true
      },
      apns: {
        payload: {
          aps: { badge: count }
        }
      },
      data: data
    };
    Device.findByIdAndUpdate(device._id, { notification_count: count }).exec();
    fcm.send(message, function (err, response) {
      if (err) return resolve(1); // Failed
      return resolve(2); // Success
    });
  });
}

function excuteText(device, title, body, data) {
  return new Promise(function (resolve, reject) {
    if (!device.registrationId || device.registrationId === '')
      return resolve(1);
    var count = device.notification_count + 1;
    var message = {
      to: device.registrationId,
      notification: {
        title: title,
        body: body,
        badge: count,
        sound: true,
        alert: true
      },
      apns: {
        payload: {
          aps: { badge: count }
        }
      },
      data: data
    };
    Device.findByIdAndUpdate(device._id, { notification_count: count }).exec();
    fcm.send(message, function (err, response) {
      if (err) return resolve(1); // Failed
      return resolve(2); // Failed
    });
  });
}
