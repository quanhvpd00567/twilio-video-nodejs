'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema,
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  REQUEST_STATUSES = Object.keys(constants.REQUEST_STATUS).map(key => constants.REQUEST_STATUS[key]);

/**
 * Schema
 */
var schema = new Schema({
  municipality: { type: Schema.ObjectId, ref: 'Municipality', required: true },

  // features_municipality in master data
  type: { type: String, required: true },
  number: { type: String, required: true },

  status: { type: String, required: true, enum: REQUEST_STATUSES, default: constants.REQUEST_STATUS.PENDING },
  rejected_reason: { type: String },
  resubmitted_reason: { type: String },

  request_items: [{ type: Schema.ObjectId, ref: 'RequestItem' }],

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
mongoose.model('Request', schema);

