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
  BANK_TYPES = Object.keys(constants.BANK_TYPE).map(key => constants.BANK_TYPE[key]);

/**
 * Municipality Schema
 */
var municipalitiesSchema = new Schema({
  admin: { type: Schema.ObjectId, ref: 'User' },
  // 自治体ID
  code: { type: String, required: true },
  // 都道府県
  prefecture: { type: String, required: true },
  // 自治体名
  name: { type: String, required: true, trim: true },

  // 寄付金の納付方法 (payment method)
  methods: [{ type: Number }],
  // 金融機関コード
  bank_code: { type: String },
  // 金融機関名
  bank_name: { type: String },
  // 支店名
  branch_code: { type: String },
  // 支店名
  branch_name: { type: String },
  // 取引種類
  bank_type: { type: Number, enum: BANK_TYPES, default: constants.BANK_TYPE.NORMAL },
  // 口座番号
  bank_number: { type: String },
  // 受取人名
  bank_owner: { type: String },
  // 受取人名(カナ)
  bank_owner_kana: { type: String },
  // 設定画面での質問
  question: { type: String },
  // 一注文当たりの購入可能上限
  max_quantity: { type: Number },
  // 確認事項
  checklist: { type: String },
  // 問い合わせ先_担当
  contact_name: { type: String },
  // 問い合わせ先_TEL
  contact_tel: { type: String },
  // 問い合わせ先_メール
  contact_mail: { type: String },

  fax: { type: String },
  fee: { type: Number, default: 0 },

  // 何度も申し込み可
  is_apply_times: { type: Boolean, default: false },
  is_setting_gift_bows: { type: Boolean, default: true },
  is_setting_docs: { type: Boolean, default: true },
  is_usage_system: { type: Number },

  is_apply_need: { type: Number, default: 2 },

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
