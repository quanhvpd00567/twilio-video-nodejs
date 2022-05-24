'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  Schema = mongoose.Schema;

/**
 * configSet Schema
 */
var schema = new Schema({
  type: { type: String, required: true },

  pps: { type: Number },
  pps_apply_start_date: { type: Date },

  minimum_donation_amount: { type: Number },
  aps: { type: Number },
  donation_amount_apply_start_date: { type: Date },

  is_applied: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false }
});

schema.plugin(paginate);

schema.pre('save', function (next) {
  next();
});

schema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};
mongoose.model('ConfigSet', schema).createCollection();

