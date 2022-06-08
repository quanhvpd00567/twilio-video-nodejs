'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  ejs = require('ejs'),
  moment = require('moment-timezone'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  config = require(path.resolve('./config/config')),
  helper = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  nodemailer = require('nodemailer');

moment.locale('ja');

var smtpTransport = nodemailer.createTransport(config.mailer.options);

exports.sendMailAdminCreateMunicipality = function (adminEmail, accountEmail, password, accountName, municName) {
  return new Promise(function (resolve, reject) {
    var template = './modules/core/server/mails/email-admin-create-municipality.server.view.html';
    var subject = helper.getServerMsLoc('ja', 'server.email.subject.create.municipality');
    var data = {
      password: password,
      accountName: accountName,
      municName,
      domain: config.system.domain
    };
    _sendMailEjs([adminEmail, accountEmail], template, subject, data)
      .then(function () {
        resolve(true);
      })
      .catch(error => {
        reject(error);
      });
  });
};

// exports.sendMailSignup = function (email, name, token) {
//   return new Promise(function (resolve, reject) {
//     const template = './modules/core/server/mails/email-signup.server.view.html';
//     const subject = helper.getServerMsLoc('ja', 'server.email.subject.user.signup');
//     const link = config.system.domain + 'member/confirm?token=' + token;
//     const data = {
//       link: link,
//       name: name
//     };
//     _sendMailEjs(email, template, subject, data)
//       .then(function () {
//         resolve(true);
//       })
//       .catch(error => {
//         reject(error);
//       });
//   });
// };

// exports.sendMailResetPassForAdmin = function (email, password, name, isEcommerce) {
//   return new Promise(function (resolve, reject) {
//     var template = './modules/core/server/mails/email-reset-password-admin.server.view.html';
//     var subject = helper.getServerMsLoc('ja', 'server.email.subject.user.reset_password');
//     var data = {
//       email: email,
//       password: password,
//       name: name
//     };
//     _sendMailEjs(email, template, subject, data, isEcommerce)
//       .then(function () {
//         resolve(true);
//       })
//       .catch(error => {
//         reject(error);
//       });
//   });
// };

// exports.sendMailResetPassForUser = function (email, password, name) {
//   return new Promise(function (resolve, reject) {
//     var template = './modules/core/server/mails/email-reset-password-user.server.view.html';
//     var subject = helper.getServerMsLoc('ja', 'server.email.subject.user.reset_password');
//     const defaultName = helper.getServerMsLoc('ja', 'server.email.default_name');
//     var data = {
//       email: email,
//       password: password,
//       name: name || defaultName
//     };
//     _sendMailEjs(email, template, subject, data)
//       .then(function () {
//         resolve(true);
//       })
//       .catch(error => {
//         reject(error);
//       });
//   });
// };

// exports.sendMailUpdatedEmail = function (email, name, token) {
//   return new Promise(function (resolve, reject) {
//     const template = './modules/core/server/mails/email-updated-email.server.view.html';
//     const subject = helper.getServerMsLoc('ja', 'server.email.subject.user.updated_email');
//     const link = config.system.domain + 'member/confirm-update-email?token=' + token;
//     const data = {
//       link: link,
//       name: name
//     };
//     _sendMailEjs(email, template, subject, data)
//       .then(function () {
//         resolve(true);
//       })
//       .catch(error => {
//         reject(error);
//       });
//   });
// };

// exports.sendMailOrderSuccess = function (email, order) {
//   return new Promise(function (resolve, reject) {
//     const template = './modules/core/server/mails/email-order-success.server.view.html';
//     let subject = helper.getServerMsLoc('ja', 'server.email.subject.order_success');
//     subject = subject.replace('{municipalityPrefecture}', order.municipality.prefecture);
//     subject = subject.replace('{municipalityName}', order.municipality.name);
//     _sendMailEjs(email, template, subject, order, true)
//       .then(function () {
//         resolve(true);
//       })
//       .catch(error => {
//         reject(error);
//       });
//   });
// };

// exports.sendMailOrderSuccessToMunicAdminAndMunicMember = function (emails, order) {
//   return new Promise(function (resolve, reject) {
//     const template = './modules/core/server/mails/email-order-success-munic.server.view.html';
//     let subject = helper.getServerMsLoc('ja', 'server.email.subject.order_success_munic');
//     _sendMailEjs(emails, template, subject, order, false)
//       .then(function () {
//         resolve(true);
//       })
//       .catch(error => {
//         reject(error);
//       });
//   });
// };

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

function _sendMail(res, mailTo, template, subject, dataContent) {
  return new Promise((resolve, reject) => {
    var mailTemplate = path.resolve(template);
    if (dataContent.domain !== undefined) {
      dataContent.domain = config.system.domain;
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

function _sendMailEjs(mailTo, template, subject, dataContent, isEcommerce) {
  return new Promise((resolve, reject) => {
    var mailTemplate = path.resolve(template);
    if (!dataContent) {
      dataContent = {};
    }
    dataContent.subject = subject;
    dataContent.domain = isEcommerce ? config.system.domain + 'ec/signin' : config.system.domain + 'authentication/signin';
    dataContent.app_name = config.app.app_name;
    dataContent.link_android = config.app.link_android;
    dataContent.link_ios = config.app.link_ios;
    ejs.renderFile(mailTemplate, dataContent, function (err, emailHTML) {
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
          logger.error(err);
          reject(err);
        }
        return resolve(info);
      });
      resolve(true);
    });
  });
}
