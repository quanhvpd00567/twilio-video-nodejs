'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema;

/**
 * Project Schema
 */
var project = new Schema({
  // 自治体
  municipality: { type: Schema.ObjectId, required: true, ref: 'Municipality' },
  // プロジェクトID
  code: { type: String, required: true },
  // プロジェクト名
  name: { type: String, required: true },
  // プロジェクト概要
  description: { type: String, required: true },
  // 代表写真
  image: { type: String, required: true },
  // 開始日時
  start: { type: Date, required: true },
  // 終了日時
  end: { type: Date, required: true },
  // 目標金額
  target_amount: { type: Number, required: true },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });

project.plugin(paginate);
project.plugin(mongooseAggregatePaginate);
project.pre('save', function (next) {
  next();
});

project.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};
mongoose.model('Project', project);

