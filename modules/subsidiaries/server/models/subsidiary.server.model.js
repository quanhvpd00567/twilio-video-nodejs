'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  path = require('path'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  KINDES = Object.keys(constants.KINDES).map(key => constants.KINDES[key]);

/**
 * Login Schema
 */
var SubsidiarySchema = new Schema({
  company: { type: Schema.ObjectId, ref: 'Company' },
  name: { type: String },
  kind: { type: Number, required: true, enum: KINDES },
  number: { type: String },
  isHQ: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
  updated: { type: Date },
  deleted: { type: Boolean, default: false }
}, { autoCreate: true });
SubsidiarySchema.plugin(paginate);
SubsidiarySchema.plugin(mongooseAggregatePaginate);

mongoose.model('Subsidiary', SubsidiarySchema);
