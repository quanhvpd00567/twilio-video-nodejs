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
  FEATURE_AUTHORIZED_TYPES = Object.keys(constants.FEATURE_AUTHORIZED_TYPE).map(key => constants.FEATURE_AUTHORIZED_TYPE[key]);

/**
 * Schema
 */
var schema = new Schema({
  type: { type: String, required: true, enum: FEATURE_AUTHORIZED_TYPES },

  municipality: { type: Schema.ObjectId, ref: 'Municipality' },
  company: { type: Schema.ObjectId, ref: 'Municipality' },

  features_authorized: [
    { feature: { type: String }, is_need_authorize: { type: Boolean, default: false } }
  ],

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
mongoose.model('FeatureAuthorized', schema);

