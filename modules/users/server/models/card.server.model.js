'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema;

/**
 * Card Schema
 */
var schema = new Schema({
  user: { type: Schema.ObjectId, ref: 'User', required: true },

  card_id: { type: String, required: true },
  card_number: { type: String },

  token: { type: String },
  token_expire_date: { type: String },

  card_expire_date: { type: String, required: true },
  // is_save_card: { type: Boolean, default: false },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });

schema.plugin(paginate);
schema.plugin(mongooseAggregatePaginate);
schema.pre('save', function (next) {
  next();
});

schema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};

mongoose.model('Card', schema);
