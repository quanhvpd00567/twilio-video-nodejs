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
  EVENT_STATUSES = Object.keys(constants.EVENT_STATUS).map(key => constants.EVENT_STATUS[key]),
  PAY_STATUSES = Object.keys(constants.PAY_STATUS).map(key => constants.PAY_STATUS[key]),
  SENT_STATUSES = Object.keys(constants.SENT_STATUS).map(key => constants.SENT_STATUS[key]);

/**
 * Comproject Schema
 */
var schema = new Schema({
  municipality: { type: Schema.ObjectId, required: true, ref: 'Municipality' },
  project: { type: Schema.ObjectId, required: true, ref: 'Project' },
  company: { type: Schema.ObjectId, required: true, ref: 'Company' },
  event: { type: Schema.ObjectId, required: true, ref: 'Event' },

  number: { type: String, unique: true, required: true },

  // 寄付金額 (donation amount)- sum amount from participant table
  total: { type: Number, default: 0 },
  reality_total: { type: Number },

  // 寄付ステータス
  pay_status: { type: Number, required: true, enum: PAY_STATUSES, default: constants.PAY_STATUS.NOT_YET },

  // 郵送ステータス
  send_status: { type: Number, required: true, enum: SENT_STATUSES, default: constants.SENT_STATUS.NOT_YET },

  // 一歩当たりの寄付金額 (amount per step) - unit: 円, required if event.type = floating
  aps: { type: Number },
  // 一歩あたりの付与ポイント (point per step) - unit: pt
  pps: { type: Number, required: true },

  // 開始日時
  start: { type: Date, required: true },
  // 終了日時
  end: { type: Date, required: true },

  // 状態
  status: { type: Number, required: true, enum: EVENT_STATUSES, default: constants.EVENT_STATUS.PREPARING },

  type: { type: String, required: true },

  is_sent_notification_at_end: { type: Boolean, default: false },

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
mongoose.model('Comproject', schema);

