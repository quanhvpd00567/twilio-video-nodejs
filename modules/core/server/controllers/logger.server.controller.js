'use strict';

/**
 * Module dependencies
 */
var winston = require('winston'),
  path = require('path'),
  DailyRotateFile = require('winston-daily-rotate-file'),
  mailer = require(path.resolve('./modules/core/server/controllers/mailer.server.controller'));

const logger = new winston.Logger();
logger.configure({
  level: 'info',
  transports: [
    new DailyRotateFile({
      filename: 'logs/logs-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

exports.info = function (err) {
  console.error('**INFO**', err);
  logger.info(err);
};
exports.warning = function (err) {
  console.error('**WARNING**', err);
  logger.warning(err);
};
exports.error = function (err) {
  console.error('**ERROR**', err);
  // mailer.sendMailError(err);
  logger.error(err);
};

exports.log = function (message) {
  var env = process.env.NODE_ENV || 'dev';
  if (env === 'dev') {
    console.log(message);
  }
};
