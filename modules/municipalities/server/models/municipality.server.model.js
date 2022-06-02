'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema;

/**
 * Municipality Schema
 */
var municipalitiesSchema = new Schema({
  admin: { type: Schema.ObjectId, ref: 'User', required: true },
  // 自治体ID
  code: { type: String, required: true },
  // 都道府県
  prefecture: { type: String, required: true },
  // 自治体名
  name: { type: String, required: true, trim: true },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date },

  is_testing: { type: Boolean, default: false }
}, { autoCreate: true });

municipalitiesSchema.plugin(paginate);
municipalitiesSchema.plugin(mongooseAggregatePaginate);
municipalitiesSchema.pre('save', function (next) {
  next();
});

municipalitiesSchema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};

mongoose.model('Municipality', municipalitiesSchema);
