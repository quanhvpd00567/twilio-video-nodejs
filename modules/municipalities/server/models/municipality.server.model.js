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
  using: { type: String, trim: true },

  fax: { type: String },
  settlement_fee: { type: Number, default: 0 },

  // ワンストップ特例申請書の送付申し込み受付
  is_apply_need: { type: Number, default: 2 },
  // 停止期間
  suspension_period: { type: Number },

  start_month: { type: Number },
  start_date: { type: Number },
  end_month: { type: Number },
  end_date: { type: Number },

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
