'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Login Schema
 */
var LoginSchema = new Schema({
  user: { type: Schema.ObjectId, ref: 'User' },
  uuid: { type: String },
  created: { type: Date, default: Date.now }
});
mongoose.model('Login', LoginSchema);
