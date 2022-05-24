'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  Schema = mongoose.Schema;

/**
 * configLog Schema
 */
var schema = new Schema({
  pps_old: { type: Number },
  pps_new: { type: Number },
  pps_apply_start_date: { type: Date },

  minimum_donation_amount_old: { type: Number },
  minimum_donation_amount_new: { type: Number },
  aps_old: { type: Number },
  aps_new: { type: Number },
  donation_amount_apply_start_date: { type: Date },

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
mongoose.model('ConfigLog', schema).createCollection();

