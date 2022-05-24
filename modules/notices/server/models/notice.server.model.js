'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema,
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants'));

/**
 * Notice Schema - お知らせ
 */
var noticeSchema = new Schema({
  // タイトル
  title: { type: String, required: true },
  // 本文
  content: { type: String, required: true },

  // 配信期間開始
  start_time: { type: Date, required: true },
  // 配信期間終了
  end_time: { type: Date, required: true },

  target: {
    type: Number,
    enum: [constants.NOTICE_TARGET.ALL, constants.NOTICE_TARGET.CONDITION],
    required: true
  },

  // Require if target = CONDITION
  municipalities: [{ type: Schema.ObjectId, ref: 'Municipality' }],
  companies: [{ type: Schema.ObjectId, ref: 'Company' }],

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });
noticeSchema.plugin(paginate);
noticeSchema.plugin(mongooseAggregatePaginate);
noticeSchema.pre('save', function (next) {
  next();
});

noticeSchema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};
mongoose.model('Notice', noticeSchema);

