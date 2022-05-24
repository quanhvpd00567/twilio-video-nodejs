'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema;

/**
 * Using Schema
 */
var using = new Schema({
  // 自治体
  municipality: { type: Schema.ObjectId, required: true, ref: 'Municipality' },
  // タイトル
  name: { type: String, required: true },
  // 説明
  description: { type: String },
  // 選択可能期間開始
  start: { type: Date },
  // 選択可能期間終了
  end: { type: Date },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });

using.plugin(paginate);
using.plugin(mongooseAggregatePaginate);
using.pre('save', function (next) {
  next();
});

using.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};
mongoose.model('Using', using);

