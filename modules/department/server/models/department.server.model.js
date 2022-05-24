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
var departmentSchema = new Schema({
  company: { type: Schema.ObjectId, ref: 'Company' },
  subsidiary: { type: Schema.ObjectId, ref: 'Subsidiary' },
  code: { type: String, required: true },
  name: { type: String, required: true, trim: true },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });

departmentSchema.plugin(paginate);
departmentSchema.plugin(mongooseAggregatePaginate);
departmentSchema.pre('save', function (next) {
  next();
});

departmentSchema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};

mongoose.model('Department', departmentSchema);
