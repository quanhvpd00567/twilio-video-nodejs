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
var schema = new Schema({
  code: { type: String },
  code2: { type: String },
  zipcode: { type: String },
  prefecture: { type: String },
  prefecture_kana: { type: String },
  city: { type: String },
  city_kana: { type: String },
  town: { type: String },
  town_kana: { type: String }
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

mongoose.model('MasterAddress', schema);
