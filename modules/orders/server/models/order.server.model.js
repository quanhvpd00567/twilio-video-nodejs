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
  user: { type: Schema.ObjectId, ref: 'User', required: true },
  // 自治体
  municipality: { type: Schema.ObjectId, ref: 'Municipality', required: true },
  location: { type: Schema.ObjectId, ref: 'Location', required: true },
  // カート
  // cart: { type: Schema.ObjectId, ref: 'Cart' },
  // card: { type: Schema.ObjectId, ref: 'Card' },

  // 注文番号
  number: { type: String, unique: true, required: true },
  // 合計 = pay_amount + point
  total: { type: Number, default: 0 },

  // 合計数量
  total_quantity: { type: Number, default: 0 },

  // 出力状態
  export_status: { type: Number, default: 1 },
  // 最初出力日
  export_date: { type: Date },

  // 名前
  name: { type: String, required: true },
  // ふりがな
  furigana: { type: String, required: true },
  // 電話番号
  tel: { type: String, required: true },
  // メール
  email: { type: String, required: true },

  // 郵便番号
  zip_code: { type: String, required: true },
  // 都道府県
  prefecture: { type: String, required: true },
  // 番地
  address: { type: String, required: true },
  // 建物名
  building: { type: String },

  products: [{
    product: { type: Schema.ObjectId, ref: 'Product', required: true },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 }
  }],

  // 申し込み日時
  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
});
orderSchema.plugin(paginate);
orderSchema.plugin(mongooseAggregatePaginate);

mongoose.model('Order', orderSchema).createCollection();
