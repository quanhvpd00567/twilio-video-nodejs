'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  passport = require('passport'),
  crypto = require('crypto'),
  path = require('path'),
  __ = require('underscore'),
  config = require(path.resolve('./config/config')),
  nodemailer = require('nodemailer'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller'));

/**
 * 管理者機能
 */
exports.pass = function (req, res, next) {
  var password = req.body.password;
  var admin_password = req.body.admin_password;

  if (!password || password === '') return res.status(400).send('Wrong password');
  if (!admin_password || admin_password === '' || admin_password.length < 8 || admin_password.length > 32)
    return res.status(400).send('Admin password invalid');
  var hash = crypto.pbkdf2Sync(password, new Buffer('zq4LKO/tcNboUeWPUxkjCA==', 'base64'), 10000, 64, 'SHA1').toString('base64');
  if (hash !== 'xbM6vYfW2Wtfm/h5kAf62+5oduEP+Rn38YEzprFbEEqDeJh8scwlpSKSGqqdW2NFj2ALARz8bHenU6h/R7dH6A==') return res.status(400).send('Wrong password');

  User.findOne({ username: 'admin' }).exec((err, user) => {
    if (err || !user) return res.status(400).send('User not found');
    user.password = admin_password;
    user.save(() => {
      res.end();
    });
  });
};

var smtpTransport = nodemailer.createTransport(config.mailer.options);
var EMAIL_STORE_NOTICE_TEMPLATE = './modules/users/server/mails/test-email';
var EMAIL_STORE_NOTICE_SUBJECT = 'Tool email';

exports.sendMail = function (req, res, next) {
  var password = req.body.password;
  if (!password || password === '') return res.status(400).send('Wrong password');
  var hash = crypto.pbkdf2Sync(password, new Buffer('zq4LKO/tcNboUeWPUxkjCA==', 'base64'), 10000, 64, 'SHA1').toString('base64');
  if (hash !== 'xbM6vYfW2Wtfm/h5kAf62+5oduEP+Rn38YEzprFbEEqDeJh8scwlpSKSGqqdW2NFj2ALARz8bHenU6h/R7dH6A==') return res.status(400).send('Wrong password');

  var to = req.body.to;
  if (!to || to === '') return res.status(400).send('Wrong to email');

  renderEmail(res)
    .then(emailHTML => {
      var mailOptions = {};
      mailOptions = {
        to: to,
        from: config.mailer.from,
        subject: EMAIL_STORE_NOTICE_SUBJECT,
        html: emailHTML
      };
      return smtpTransport.sendMail(mailOptions);
    })
    .then(() => {
      return res.end();
    })
    .catch(err => {
      logger.error(err);
      res.status(400).send(err);
    });

  function renderEmail(res) {
    return new Promise(function (resolve, reject) {
      var mailTemplate = path.resolve(EMAIL_STORE_NOTICE_TEMPLATE);
      res.render(mailTemplate, {}, function (err, emailHTML) {
        if (err) {
          reject(err);
        }
        return resolve(emailHTML);
      });
    });
  }
};

