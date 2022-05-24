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
  REQUEST_ITEM_STATUSES = Object.keys(constants.REQUEST_ITEM_STATUS).map(key => constants.REQUEST_ITEM_STATUS[key]);

/**
 * Schema
 */
var schema = new Schema({
  municipality: { type: Schema.ObjectId, ref: 'Municipality', required: true },

  // features_municipality in master data
  type: { type: String, required: true },

  status: { type: String, required: true, enum: REQUEST_ITEM_STATUSES, default: constants.REQUEST_ITEM_STATUS.PENDING },
  data: {},

  product: { type: Schema.ObjectId, ref: 'Product' },
  product_code: { type: String }, // to check unique

  user: { type: Schema.ObjectId, ref: 'User' },
  munic_member_number: { type: String }, // to check unique
  email: { type: String }, // to check unique

  project: { type: Schema.ObjectId, ref: 'Project' },
  using: { type: Schema.ObjectId, ref: 'Using' },

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
mongoose.model('RequestItem', schema);

