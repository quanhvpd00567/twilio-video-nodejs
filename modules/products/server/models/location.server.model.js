'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema;

/**
 * Participant Schema
 */
var locationSchema = new Schema({
  // 自治体
  municipality: { type: Schema.ObjectId, ref: 'Municipality', required: true },
  name: { type: String, required: true },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });

locationSchema.plugin(paginate);
locationSchema.plugin(mongooseAggregatePaginate);
locationSchema.pre('save', function (next) {
  next();
});

locationSchema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};

mongoose.model('Location', locationSchema);
