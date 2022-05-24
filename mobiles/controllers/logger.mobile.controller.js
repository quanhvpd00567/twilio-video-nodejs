'use strict';

/**
 * Module dependencies
 */
var winston = require('winston'),
  DailyRotateFile = require('winston-daily-rotate-file');

const logger = new winston.Logger();
logger.configure({
  level: 'info',
  transports: [
    new DailyRotateFile({
      filename: 'logs/mobile-%DATE%.log',
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
  logger.error(err);
};
