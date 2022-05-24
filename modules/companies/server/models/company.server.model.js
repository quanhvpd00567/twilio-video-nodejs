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
  KINDES = Object.keys(constants.KINDES).map(key => constants.KINDES[key]);

/**
 * Participant Schema
 */
var companySchema = new Schema({
  admin: { type: Schema.ObjectId, ref: 'User' },
  code: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  kind: { type: Number, required: true, enum: KINDES },
  number: { type: String, required: true },

  ranking_to_show: { type: String, default: constants.COMPANY_SETTING_RANKING.DEPARTMENT_RANKING },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date },
  is_testing: { type: Boolean, default: false }
}, { autoCreate: true });

companySchema.plugin(paginate);
companySchema.plugin(mongooseAggregatePaginate);
companySchema.pre('save', function (next) {
  next();
});

companySchema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};

mongoose.model('Company', companySchema);
