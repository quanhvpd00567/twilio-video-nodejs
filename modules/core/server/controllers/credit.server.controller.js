'use strict';

var _ = require('lodash'),
  __ = require('underscore'),
  crypto = require('crypto'),
  request = require('request'),
  mongoose = require('mongoose'),
  path = require('path'),
  winston = require('winston'),
  DailyRotateFile = require('winston-daily-rotate-file'),
  config = require(path.resolve('./config/config')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller'));

const credit_logger = new winston.Logger();
credit_logger.configure({
  level: 'info',
  transports: [
    new DailyRotateFile({
      filename: 'logs/credit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

exports.authorize = function (userId, token) {
  return new Promise(function (resolve, reject) {
    if (!userId) return reject();
    var data = {
      params: {
        orderId: __.random(1000, 9999999),
        // orderId: order.seq,
        amount: 2,
        jpo: 10,
        // withCapture: true,,
        payNowIdParam: {
          token: token,
          accountParam: { accountId: userId }
        },
        txnVersion: '2.0',
        dummyRequest: config.veritrans.dummyRequest,
        merchantCcid: config.veritrans.ccid
      }
    };

    data.authHash = genAuthHash(data.params);
    var body = JSON.stringify(data);
    var options = {
      url: config.veritrans.urls.authorize,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'Accept-Language': 'ja',
        'Content-Type': 'application/json'
      },
      form: body,
      json: true
    };
    request.post(options, (err, httpResponse, body) => {
      if (err) {
        logger.error(err);
        return reject();
      }
      return resolve(body);
    });
  });
};
exports.pay = function (userId, orderId, cardId, amount) {
  return new Promise(function (resolve, reject) {
    if (!userId) return reject();
    // Sử dụng order_id
    var data = {
      params: {
        orderId: orderId,
        amount: amount,
        jpo: 10,
        withCapture: true,
        payNowIdParam: {
          accountParam: { accountId: userId,
            cardParam: { cardId: cardId }
          }
        },
        txnVersion: '2.0',
        dummyRequest: config.veritrans.dummyRequest,
        merchantCcid: config.veritrans.ccid
      }
    };

    data.authHash = genAuthHash(data.params);
    var body = JSON.stringify(data);
    var options = {
      url: config.veritrans.urls.authorize,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'Accept-Language': 'en',
        'Content-Type': 'application/json'
      },
      form: body,
      json: true
    };
    request.post(options, (err, httpResponse, body) => {
      if (err) {
        logger.error(err);
        return reject();
      }
      return resolve(body);
    });
  });
};
exports.update = function (userId, card) {
  return new Promise(function (resolve, reject) {
    if (!userId) return reject();
    var data = {
      params: {
        payNowIdParam: {
          accountParam: {
            accountId: userId,
            cardParam: card
          }
        },
        txnVersion: '2.0',
        dummyRequest: config.veritrans.dummyRequest,
        merchantCcid: config.veritrans.ccid
      }
    };
    data.authHash = genAuthHash(data.params);
    var body = JSON.stringify(data);
    var options = {
      url: config.veritrans.urls.update,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'Accept-Language': 'en',
        'Content-Type': 'application/json'
      },
      form: body,
      json: true
    };
    request.post(options, (err, httpResponse, body) => {
      if (err) {
        logger.error(err);
        return reject();
      }
      return resolve(body);
    });
  });
};
exports.delete = function (userId, cardId) {
  return new Promise(function (resolve, reject) {
    if (!userId) return reject();
    var data = {
      params: {
        payNowIdParam: {
          accountParam: {
            accountId: userId,
            cardParam: { cardId: cardId }
          }
        },
        txnVersion: '2.0',
        dummyRequest: config.veritrans.dummyRequest,
        merchantCcid: config.veritrans.ccid
      }
    };
    data.authHash = genAuthHash(data.params);
    var body = JSON.stringify(data);
    var options = {
      url: config.veritrans.urls.delete,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'Accept-Language': 'en',
        'Content-Type': 'application/json'
      },
      form: body,
      json: true
    };
    request.post(options, (err, httpResponse, body) => {
      if (err) {
        logger.error(err);
        return reject({ status: 500, message: 'サーバーでエラーが発生しました' });
      }
      return resolve(body);
    });
  });
};
exports.recurring_add = function (userId, groupId) {
  return new Promise(function (resolve, reject) {
    if (!userId) return reject();
    var data = {
      params: {
        payNowIdParam: {
          accountParam: {
            accountId: userId,
            recurringChargeParam: { groupId: groupId }
          }
        },
        txnVersion: '2.0',
        dummyRequest: config.veritrans.dummyRequest,
        merchantCcid: config.veritrans.ccid
      }
    };
    data.authHash = genAuthHash(data.params);
    var body = JSON.stringify(data);
    var options = {
      url: config.veritrans.urls.recurring_add,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'Accept-Language': 'en',
        'Content-Type': 'application/json'
      },
      form: body,
      json: true
    };
    request.post(options, (err, httpResponse, body) => {
      if (err) {
        logger.error(err);
        return reject();
      }
      return resolve(body);
    });
  });
};
exports.recurring_del = function (userId, groupId) {
  return new Promise(function (resolve, reject) {
    if (!userId) return reject();
    var data = {
      params: {
        payNowIdParam: {
          accountParam: {
            accountId: userId,
            recurringChargeParam: { groupId: groupId }
          }
        },
        txnVersion: '2.0',
        dummyRequest: config.veritrans.dummyRequest,
        merchantCcid: config.veritrans.ccid
      }
    };
    data.authHash = genAuthHash(data.params);
    var body = JSON.stringify(data);
    var options = {
      url: config.veritrans.urls.recurring_del,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'Accept-Language': 'en',
        'Content-Type': 'application/json'
      },
      form: body,
      json: true
    };
    request.post(options, (err, httpResponse, body) => {
      if (err) {
        logger.error(err);
        return reject();
      }
      return resolve(body);
    });
  });
};
exports.writeLog = function (err) {
  console.log('-------------------------------------------------------------', err);
  // credit_logger.error(err);
};

function genAuthHash(data) {
  var req = JSON.stringify(data);
  var authStr = config.veritrans.ccid + req + config.veritrans.password;
  console.log(authStr);
  console.log('-------------------------------------------------------------');
  var authHash = crypto.createHash('sha256').update(authStr).digest('hex');
  return authHash;
}
