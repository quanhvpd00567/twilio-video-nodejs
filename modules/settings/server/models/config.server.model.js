'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  Schema = mongoose.Schema;

/**
 * config Schema
 */
var configSchema = new Schema({
  // リクエスト回数
  version: { type: String, default: '20191214' },

  app: {
    deep_link: { type: String, default: '' },

    ios_link: { type: String, default: '' },
    ios_version: { type: String, default: '1.0' },
    ios_version_require: { type: String, default: '1.0' },
    // ios_require: { type: Boolean, default: false },

    android_link: { type: String, default: '' },
    android_version: { type: String, default: '1.0' },
    android_version_require: { type: String, default: '1.0' }
    // android_require: { type: Boolean, default: false }
  },

  // resolutions:
  resolutions: [
    { type: String }
  ],

  // 現在のポイント - %
  pps: { type: Number, default: 0.00001 },
  pps_applied_date: { type: Date },

  // 最低寄付金額
  minimum_donation_amount: { type: Number },
  // 一歩当たりの寄付金額 - amount per step
  aps: { type: Number },
  donation_amount_applied_date: { type: Date },

  // ポイント上限設定
  max_point: { type: Number, default: 20 },

  // 利用規約
  term: { type: String },

  // プライバシーポリシー
  policy: { type: String },

  // ふふるを開く (if have value show button 'ふふるを開く' in app)
  is_show_open_furu: { type: Boolean, default: false },
  // ふふるのURL
  furu_url: { type: String },

  // 企業版ふるさと納税とは
  corporate_tax_payment_url: { type: String, default: '' },
  // 個人版ふるさと納税とは
  personal_tax_payment_url: { type: String, default: '' },

  // days to show a finished event in app
  days_show_finished_event: { type: Number, default: 14 },

  fix_user: [],
  allow_fix_step: { type: Boolean, default: false },
  fix_all_user: { type: Boolean, default: false },
  fix_key: { type: String },

  updated: { type: Date },
  created: { type: Date, default: Date.now }
});

configSchema.plugin(paginate);

configSchema.pre('save', function (next) {
  next();
});

configSchema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};
mongoose.model('Config', configSchema).createCollection();

