'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * CreditCard Schema
 */
var CreditCardSchema = new Schema({
  token: { type: String },
  token_expire_date: { type: String },
  cardId: { type: String },
  cardNumber: { type: String },
  cardExpire: { type: String },
  user: { type: Schema.ObjectId, ref: 'User' }
});

mongoose.model('CreditCard', CreditCardSchema);

