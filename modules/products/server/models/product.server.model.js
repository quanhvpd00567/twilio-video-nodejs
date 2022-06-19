'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema;

/**
 * Participant Schema
 */
var productSchema = new Schema({
  // 自治体
  municipality: { type: Schema.ObjectId, ref: 'Municipality' },
  // 出品対象導入施設
  locations: [{ type: Schema.ObjectId, ref: 'Location' }],
  // 販売状態
  sell_status: { type: Number, default: 1, required: true },
  // 表示状態
  show_status: { type: Number, default: 1, required: true },
  // 返礼品コード
  code: { type: String, required: true },
  // 返礼品
  name: { type: String, required: true },
  // 価格
  price: { type: Number, required: true },
  // 容量
  capacity: { type: String },
  // 消費期限
  expire: { type: Number, default: 1, required: true },
  // 消費期限
  expire_detail: { type: String },
  // 取扱い事業者
  operator: { type: String, required: true },

  is_set_stock_quantity: { type: Number },
  // 取扱い数量
  stock_quantity: { type: Number },

  is_set_max_quantity: { type: Number },
  // 購入上限
  max_quantity: { type: Number },

  is_deadline: { type: Number },
  // 申込期日
  deadline: { type: String },
  // 商品説明
  description: { type: String },
  // 代表写真
  avatar: { type: String, required: true },
  // 追加写真
  pictures: { type: [{ type: String }] },

  ship_method: { type: Number },
  // 配送会社
  ship_company: { type: String },
  // 発送期日
  ship_date: { type: String },
  // 配送希望設定
  is_accept_schedule: { type: Number, default: 1 },
  // 配送希望時間
  accepted_schedule: { type: [{ type: String }] },
  // 配送不可地域
  except_place: { type: String },

  except_place_options: { type: [{ type: Number }] },
  // 配送除外日
  except_date: { type: String },
  // のし対応
  is_accept_noshi: { type: Number, default: 1 },

  // 申込条件
  is_apply_condition: { type: Boolean, default: true },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });

productSchema.plugin(paginate);
productSchema.plugin(mongooseAggregatePaginate);
productSchema.pre('save', function (next) {
  next();
});

productSchema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};

mongoose.model('Product', productSchema);
