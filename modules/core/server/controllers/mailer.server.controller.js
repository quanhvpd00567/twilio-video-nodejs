'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  ejs = require('ejs'),
  moment = require('moment-timezone'),
  __ = require('underscore'),
  Promise = require('bluebird'),
  config = require(path.resolve('./config/config')),
  nodemailer = require('nodemailer');

moment.locale('ja');

var EMAIL_ERR_TEMPLATE = './modules/core/server/mails/error-email.server.view.html';
var EMAIL_ERR_SUBJECT = ' ERROR';

var smtpTransport = nodemailer.createTransport(config.mailer.options);

exports.sendMail = function (res, mailTo, template, subject, dataContent) {
  return new Promise((resolve, reject) => {
    _sendMail(res, mailTo, template, subject, dataContent)
      .then(function (rs) {
        return resolve(rs);
      })
      .catch(function (err) {
        return reject(err);
      });
  });
};

exports.sendMailEjs = function (mailTo, template, subject, dataContent) {
  return new Promise((resolve, reject) => {
    _sendMailEjs(mailTo, template, subject, dataContent)
      .then(function (rs) {
        return resolve(rs);
      })
      .catch(function (err) {
        return reject(err);
      });
  });
};

exports.sendMailError = function (error) {
  return new Promise((resolve, reject) => {
    var email = config.mailer_error_to;
    _sendMailEjs(email, EMAIL_ERR_TEMPLATE, EMAIL_ERR_SUBJECT, { error: error.stack })
      .then(() => {
        resolve(true);
      })
      .catch(err => {
        reject(err);
      });
  });
};

function _sendMail(res, mailTo, template, subject, dataContent) {
  return new Promise((resolve, reject) => {
    var mailTemplate = path.resolve(template);
    if (dataContent.domain !== undefined) {
      dataContent.domain = config.app.domain;
    }
    res.render(mailTemplate, dataContent, function (err, emailHTML) {
      if (err) {
        reject(err);
      }
      var mailOptions = {
        to: mailTo,
        from: config.mailer.from,
        subject: subject,
        html: emailHTML
      };
      smtpTransport.sendMail(mailOptions, function (err, info) {
        if (err) {
          reject(err);
        }
        return resolve(info);
      });
    });
  });
}
function _sendMailEjs(mailTo, template, subject, dataContent) {
  return new Promise((resolve, reject) => {
    var mailTemplate = path.resolve(template);
    if (!dataContent) {
      dataContent = {};
    }
    dataContent.subject = config.mailer.prefix_subject + subject;
    dataContent.domain = config.system.domain;
    dataContent.app_name = config.app.app_name;
    ejs.renderFile(mailTemplate, dataContent, { rmWhitespace: true }, function (err, emailHTML) {
      if (err) {
        reject(err);
      }
      var mailOptions = {
        to: mailTo,
        from: config.mailer.from,
        subject: dataContent.subject,
        html: emailHTML
      };
      smtpTransport.sendMail(mailOptions, function (err, info) {
        if (err) {
          reject(err);
        }
        return resolve(info);
      });
      resolve();
    });
  });
}
