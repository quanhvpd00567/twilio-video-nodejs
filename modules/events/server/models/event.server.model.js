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
  MAGAZINE_TYPES = Object.keys(constants.MAGAZINE_TYPE).map(key => constants.MAGAZINE_TYPE[key]),
  SENT_STATUSES = Object.keys(constants.SENT_STATUS).map(key => constants.SENT_STATUS[key]),
  PAYMENT_METHODS = Object.keys(constants.PAYMENT_METHOD).map(key => constants.PAYMENT_METHOD[key]),
  EVENT_TYPES = Object.keys(constants.EVENT_TYPE).map(key => constants.EVENT_TYPE[key]),
  PAY_STATUSES = Object.keys(constants.PAY_STATUS).map(key => constants.PAY_STATUS[key]);

/**
 * Event Schema
 */
var schema = new Schema({
  municipality: { type: Schema.ObjectId, required: true, ref: 'Municipality' },
  company: { type: Schema.ObjectId, required: true, ref: 'Company' },

  // イベント名
  event_name: { type: String },

  number: { type: String, unique: true, required: true },

  // 寄付金額 (donation amount)- sum total from comproject table
  total: { type: Number, default: 0 },
  reality_total: { type: Number },

  // sum of amount of all participant of event
  current_total: { type: Number, default: 0 },

  // 寄付金の納付方法 - payment method
  method: { type: Number, required: true, enum: PAYMENT_METHODS, default: constants.PAYMENT_METHOD.PAYMENT_SLIP },
  // 一歩当たりの寄付金額 (amount per step) - unit: 円, required if type = floating
  aps: { type: Number },
  // 一歩あたりの付与ポイント (point per step) - unit: pt
  pps: { type: Number, required: true },

  // 寄付ステータス
  pay_status: { type: Number, required: true, enum: PAY_STATUSES, default: constants.PAY_STATUS.NOT_YET },

  // 郵送ステータス
  send_status: { type: Number, required: true, enum: SENT_STATUSES, default: constants.SENT_STATUS.NOT_YET },

  // 開始日時
  start: { type: Date, required: true },
  // 終了日時
  end: { type: Date, required: true },

  // 状態
  status: { type: Number, required: true, enum: EVENT_STATUSES, default: constants.EVENT_STATUS.PREPARING },

  // 最低寄付金額
  min_donation_amount: { type: Number },
  // 最高寄付金額
  max_donation_amount: { type: Number },

  // 広報誌・HPなど情報媒体への掲載
  magazine: { type: Number, required: true, enum: MAGAZINE_TYPES, default: constants.MAGAZINE_TYPE.NOT_DESIRED },
  // 送付先郵便番号
  zipcode: { type: String },
  // 送付先住所
  address: { type: String },
  // 宛名
  name: { type: String },

  type: { type: String, required: true, enum: EVENT_TYPES },

  // 寄付金額 - required if type = fixed
  donation_amount: { type: Number },

  is_cal_rank_growth_rank: { type: Boolean, default: false },

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
mongoose.model('Event', schema);

