'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema;

/**
 * Device Schema
 */
var orderSchema = new Schema({
  // 参加者
  user: { type: Schema.ObjectId, ref: 'User' },
  // 自治体
  municipality: { type: Schema.ObjectId, ref: 'Municipality' },
  // カート
  cart: { type: Schema.ObjectId, ref: 'Cart' },

  card: { type: Schema.ObjectId, ref: 'Card' },

  // 寄付金の使い道
  using: { type: Schema.ObjectId, ref: 'Using' },

  // 注文番号
  number: { type: String, unique: true, required: true },
  // 合計 = pay_amount + point
  total: { type: Number, default: 0 },
  // 決済金額
  pay_amount: { type: Number, default: 0 },
  // 利用ポイント
  point: { type: Number, default: 0 },
  // 合計数量
  total_quantity: { type: Number, default: 0 },
  // 払込方法
  payment: { type: Number, default: 1 },
  // 出力状態
  export_status: { type: Number, default: 1 },
  // 最初出力日
  export_date: { type: Date },

  // 寄付者情報_寄付者名_姓.
  first_name: { type: String },
  // 寄付者情報_寄付者名_名
  last_name: { type: String },
  // 寄付者情報_寄付者名_姓(かな)
  first_name_kana: { type: String },
  // 寄付者情報_寄付者名_名(かな)
  last_name_kana: { type: String },

  // 寄付者情報_連絡先_電話番号
  tel: { type: String },
  // 寄付者情報_連絡先_メールアドレス
  email: { type: String },
  // 寄付者情報_連絡先_メールアドレス(確認)
  email_confirm: { type: String },
  // 寄付者情報_住民票_郵便番号
  zip_code: { type: String },
  // 寄付者情報_住民票_都道府県
  prefecture: { type: String },
  // 寄付者情報_住民票_市区町村
  city: { type: String },
  // 寄付者情報_住民票_番地
  address: { type: String },
  // 寄付者情報_住民票_建物名
  building: { type: String },
  // 書類送付先
  doc_is_same_resident: { type: Number, default: 1 },
  // 書類送付先_姓
  doc_add_first_name: { type: String },
  // 書類送付先_名
  doc_add_last_name: { type: String },
  // 書類送付先_姓(かな)
  doc_add_first_name_kana: { type: String },
  // 書類送付先_名(かな)
  doc_add_last_name_kana: { type: String },
  // 書類送付先_電話番号
  doc_add_tel: { type: String },
  // 書類送付先_郵便番号
  doc_add_zipcode: { type: String },
  // 書類送付先_都道府県
  doc_add_prefecture: { type: String },
  // 書類送付先_市区町村
  doc_add_city: { type: String },
  // 書類送付先_番地
  doc_add_address: { type: String },
  // 書類送付先_建物名
  doc_add_building: { type: String },
  // 申請書の送付
  apply_is_need: { type: Number, default: 1 },
  // 申請書の送付_性別
  apply_sex: { type: Number, default: 1 },
  // 申請書の送付_生年月日
  apply_birthday: { type: String },
  // 備考_質問
  note_question: { type: String },
  // 備考_回答
  note_content: { type: String },
  products: [{
    product: { type: Schema.ObjectId, ref: 'Product' },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    is_same_resident: { type: Number, default: 1 },
    first_name: { type: String },
    last_name: { type: String },
    first_name_kana: { type: String },
    last_name_kana: { type: String },
    tel: { type: String },
    zipcode: { type: String },
    prefecture: { type: String },
    city: { type: String },
    address: { type: String },
    building: { type: String },
    accepted_schedule: { type: String },
    note_detail_address: { type: String }
  }],

  is_usage_system: { type: Number, default: null },

  // 申し込み日時
  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
});
orderSchema.plugin(paginate);
orderSchema.plugin(mongooseAggregatePaginate);

mongoose.model('Order', orderSchema).createCollection();
