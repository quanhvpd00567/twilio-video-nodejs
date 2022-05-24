'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  CreditCard = mongoose.model('CreditCard'),
  Card = mongoose.model('Card'),
  Order = mongoose.model('Order'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  helper = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  credit = require(path.resolve('./modules/core/server/controllers/credit.server.controller'));

/**
 * クレジットカード登録
 * @param token
 * @param token_expire_date
 * @returns
 */
exports.credit_add = function (req, res) {
  req.checkBody('token', helper.getMsLoc(req.language)).notEmpty();
  req.checkBody('token_expire_date', helper.getMsLoc(req.language)).notEmpty();

  var errors = req.validationErrors();
  if (errors)
    return res.status(403).send(helper.getMessage(errors));

  var user = req.user;
  var userId = req.user._id;
  var token = req.body.token;
  var token_expire_date = req.body.token_expire_date;
  if (!user || !user.roles[0])
    return res.status(422).send({ message: helper.getMsLoc(req.language) });

  var cardInfo = null;
  credit.authorize(userId, token)
    .then(response => {
      var result = response.result;
      var vResultCode = result.vResultCode;
      if (!vResultCode) return Promise.reject();
      if (vResultCode.indexOf('A001') === 0) {
        var payNowIdResponse = response.payNowIdResponse;
        if (!payNowIdResponse) return Promise.reject();
        var account = payNowIdResponse.account;
        if (!account) return Promise.reject();
        cardInfo = account.cardInfo[0];
        if (!cardInfo) return Promise.reject();

        return Promise.resolve(true);
      } else if (vResultCode.indexOf('AE10') === 0) {
        return Promise.reject({ key: 'authorize_AE10', status: 422 });
      } else if (vResultCode.indexOf('AG64') === 0) {
        return Promise.reject({ key: 'authorize_AG64', status: 422 });
      } else if (vResultCode.indexOf('AGB7') === 0) {
        return Promise.reject({ key: 'authorize_AGB7', status: 422 });
      } else {
        return Promise.reject({ key: 'authorize_other', status: 422 });
      }
    })
    .then(() => {
      return save_credit(cardInfo, token, token_expire_date, userId);
      // return cardInfo;
    })
    .then((card) => {
      return res.jsonp({ cardExpire: card.cardExpire, cardNumber: card.cardNumber, _id: card._id, cardId: card.cardId });
    })
    .catch(err => {
      logger.error(err);
      if (err && err.key)
        return res.status(err.status).send({ message: helper.getMsLoc(req.language, err.key) });
      return res.status(500).send({ message: helper.getMsLoc(req.language, 'credit_failure') });
    });

  function save_credit(cardInfo, token, token_expire_date, userId) {
    return new Promise((resolve, reject) => {
      var new_card = new CreditCard(cardInfo);
      new_card.token = token;
      new_card.token_expire_date = token_expire_date;
      new_card.user = userId;
      new_card.save(function (err, rs) {
        if (err) {
          reject(err);
        }
        resolve(new_card);
      });
    });
  }

};
/**
 * クレジットカード更新
 * @param card_expire
 * @param security_code
 * @returns
 */
exports.credit_update = function (req, res) {
  req.checkBody('card_expire', helper.getMsLoc(req.language)).notEmpty();
  req.checkBody('security_code', helper.getMsLoc(req.language)).notEmpty();
  req.checkBody('cardId', helper.getMsLoc(req.language)).notEmpty();

  var errors = req.validationErrors();
  if (errors)
    return res.status(403).send(helper.getMessage(errors));

  var user = req.user;
  var userId = req.user;
  var card_expire = req.body.card_expire;
  var security_code = req.body.security_code;
  var cardId = req.body.cardId;
  if (!user || !user.roles[0])
    return res.status(422).send({ message: helper.getMsLoc(req.language) });

  var condition = {};
  condition._id = cardId;
  condition.user = userId;
  var card = null;
  CreditCard.findOne(condition)
    .then(_card => {
      card = _card;
      if (!card) return Promise.reject();
      return credit.update(userId, { cardId: card.cardId, cardExpire: card_expire, securityCode: security_code });
    })
    .then(response => {
      var result = response.result;
      var vResultCode = result.vResultCode;
      if (!vResultCode) return Promise.reject();
      if (vResultCode.indexOf('X001') === 0 || vResultCode.indexOf('X002') === 0) {
        return CreditCard.findByIdAndUpdate(card._id, { cardExpire: card_expire }, { new: true });
      } else if (vResultCode.indexOf('AE10') === 0) {
        return Promise.reject({ key: 'update_AE10', status: 422 });
      } else if (vResultCode.indexOf('AG64') === 0) {
        return Promise.reject({ key: 'update_AG64', status: 422 });
      } else if (vResultCode.indexOf('AGB7') === 0) {
        return Promise.reject({ key: 'update_AGB7', status: 422 });
      } else {
        return Promise.reject({ key: 'update_other', status: 422 });
      }
    })
    .then(_card => {
      return res.end();
    })
    .catch(err => {
      logger.error(err);
      if (err && err.key)
        return res.status(err.status).send({ message: helper.getMsLoc(req.language, err.key) });
      return res.status(500).send({ message: helper.getMsLoc(req.language, 'credit_failure_update') });
    });
};
/**
 * クレジットカード削除
 * @returns
 */
exports.credit_delete = function (req, res) {
  req.checkBody('cardId', helper.getMsLoc(req.language)).notEmpty();
  var errors = req.validationErrors();
  if (errors)
    return res.status(403).send(helper.getMessage(errors));

  var userId = req.user._id;
  var condition = {};
  condition.user = userId;
  condition._id = req.body.cardId;

  var card = null;
  CreditCard.findOne(condition)
    .then(_card => {
      console.log('~ _card', _card);
      if (!_card) return Promise.reject();
      card = _card;
      return credit.delete(userId, card.cardId);
    })
    .then(response => {
      var result = response.result;
      var vResultCode = result.vResultCode;
      if (!vResultCode) return Promise.reject();
      if (vResultCode.indexOf('X001') === 0 || vResultCode.indexOf('X002') === 0) {
        return CreditCard.findByIdAndRemove(card._id);
      } else if (vResultCode.indexOf('AE10') === 0) {
        return Promise.reject({ key: 'update_AE10', status: 422 });
      } else if (vResultCode.indexOf('AG64') === 0) {
        return Promise.reject({ key: 'update_AG64', status: 422 });
      } else if (vResultCode.indexOf('AGB7') === 0) {
        return Promise.reject({ key: 'update_AGB7', status: 422 });
      } else {
        return Promise.reject({ key: 'update_other', status: 422 });
      }
    })
    .then(() => {
      return res.end();
    })
    .catch(err => {
      logger.error(err);
      if (err && err.key)
        return res.status(err.status).send({ message: helper.getMsLoc(req.language, err.key) });
      return res.status(500).send({ message: helper.getMsLoc(req.language, 'credit_failure_delete') });
    });
};
/**
 * クレジットカード更新
 * @param userId
 * @returns
 */
exports.credit_invoice = function (req, res) {
  var userId = req.user._id;
  var condition = {};
  condition.user = userId;

  var card = null;
  CreditCard.findOne(condition)
    .then(_card => {
      card = _card;
      return User.findByIdAndUpdate(userId, { is_credit: false }, { new: true });
    })
    .then(user => {
      if (!user.is_credit) {
        return res.jsonp(user);
      } else {
        var cardId = card.cardId || '';
        credit.delete(userId, card.cardId)
          .then(response => {
            var result = response.result;
            var vResultCode = result.vResultCode;
            if (!vResultCode) return Promise.reject();
            if (vResultCode.indexOf('X001') === 0) {
              return CreditCard.findByIdAndRemove(cardId);
            } else if (vResultCode.indexOf('AE10') === 0) {
              return Promise.reject({ key: 'update_AE10', status: 422 });
            } else if (vResultCode.indexOf('AG64') === 0) {
              return Promise.reject({ key: 'update_AG64', status: 422 });
            } else if (vResultCode.indexOf('AGB7') === 0) {
              return Promise.reject({ key: 'update_AGB7', status: 422 });
            } else {
              return Promise.reject({ key: 'update_other', status: 422 });
            }
          })
          .then(() => {
            return User.findByIdAndUpdate(userId, { is_credit: false }, { new: true });
          })
          .then(user => {
            return res.jsonp(user);
          })
          .catch(err => {
            logger.error(err);
            if (err && err.key)
              return res.status(err.status).send({ message: helper.getMsLoc(req.language, err.key) });
            return res.status(500).send({ message: helper.getMsLoc(req.language, 'credit_failure_delete') });
          });
      }
    })
    .catch(err => {
      logger.error(err);
      if (err && err.key)
        return res.status(err.status).send({ message: helper.getMsLoc(req.language, err.key) });
      return res.status(500).send({ message: helper.getMsLoc(req.language, 'credit_failure_delete') });
    });
};
/**
 * クレジットカード更新
 * @param userId
 * @returns
 */
exports.credit_info = function (req, res) {
  var userId = req.user;
  var condition = {};
  condition.user = userId;

  CreditCard.find(condition)
    .then(cards => {
      if (!cards) return res.jsonp([{}]);
      console.log('~ cards', cards);
      var array = [];
      cards.forEach(card => {
        array.push({ cardExpire: card.cardExpire, cardNumber: card.cardNumber, _id: card._id });
      });
      return res.jsonp(array);
    })
    .catch(err => {
      logger.error(err);
      return res.status(500).send({ message: helper.getMsLoc(req.language) });
    });
};

exports.credit_token = function (req, res) {
  return res.json({ token: config.veritrans.token_api_key });
};

exports.credit_pay = function (req, res) {
  req.checkBody('orderId', helper.getMsLoc(req.language)).notEmpty();
  req.checkBody('cardId', helper.getMsLoc(req.language)).notEmpty();
  req.checkBody('amount', helper.getMsLoc(req.language)).notEmpty();

  var errors = req.validationErrors();
  if (errors)
    return res.status(403).send(helper.getMessage(errors));

  var user = req.user;
  var orderId = req.body.orderId;
  var cardId = req.body.cardId;
  console.log('~ orderId', orderId);
  var amount = req.body.amount;
  console.log('~ amount', amount);
  var condition = {};
  condition.user = req.user._id;
  condition._id = req.body.cardId;
  CreditCard.findOne(condition)
    .then(_card => {
      console.log('~ _card', _card);
      if (!_card) return Promise.reject();
      cardId = _card.cardId;
      return update_payment(orderId, cardId, amount, user);
    })
    .then(done_status => {
      var rs = {};
      if (done_status === 1) {
        rs.message = helper.getMsLoc(req.language, 'payment_result_credit_success');
        rs.success = true;
      } else {
        rs.message = helper.getMsLoc(req.language, 'payment_result_credit_fail');
        rs.success = false;
      }

      return res.jsonp(rs);
    })
    .catch(err => {
      logger.error(err);
      return res.status(422).send({
        message: helper.getMsLoc(req.language)
      });
    });

  function update_payment(orderId, cardId, amount, user) {
    return new Promise((resolve, reject) => {
      var session;
      var done_status;
      mongoose.startSession()
        .then(_session => {
          session = _session;
          session.startTransaction();
          return credit.pay(user._id, orderId, cardId, amount);
        })
        .then(response => {
          var result = response.result;
          var vResultCode = result.vResultCode;
          console.log('vResultCode ', vResultCode);
          if (!vResultCode) return Promise.reject();
          if (vResultCode.indexOf('A001') === 0) {
            done_status = 1;
            return session.commitTransaction()
              .then(() => {
                session.endSession();
                resolve(done_status);
              });
          } else if (vResultCode.indexOf('AE10') === 0) {
            done_status = 2;
          } else if (vResultCode.indexOf('AG64') === 0) {
            done_status = 2;
          } else if (vResultCode.indexOf('AGB7') === 0) {
            done_status = 2;
          } else {
            done_status = 2;
          }
          return resolve(done_status);

        })
        .catch((err) => {
          session.abortTransaction().then(() => {
            session.endSession();
            reject(err);
          });
        });
    });
  }
};
