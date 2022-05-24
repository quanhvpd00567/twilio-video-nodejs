'use strict';

var validator = require('validator'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller'));

exports.unique = function (req, res) {
  var params = req.body.params || {};
  var unique = true;
  var query = {};
  switch (params.type) {
    case 'username':
      query = { username: params.username, deleted: false, _id: { '$ne': params.id } };
      User.findOne(query).select('username').exec()
        .then(function (_obj) {
          if (_obj) {
            unique = false;
          }
          res.json({ unique: unique });
        })
        .catch(err => {
          logger.error(err);
          return res.status(422).send({
            message: 'サーバーエラーが発生しました。'
          });
        });
      break;
    case 'email':
      query = { email: params.email, deleted: false, _id: { '$ne': params.id } };
      User.findOne(query).select('username').exec()
        .then(function (_obj) {
          if (_obj) {
            unique = false;
          }
          res.json({ unique: unique });
        })
        .catch(err => {
          logger.error(err);
          return res.status(422).send({
            message: 'サーバーエラーが発生しました。'
          });
        });
      break;
    default:
      return res.status(422).send({
        message: 'サーバーエラーが発生しました。'
      });
  }

};

