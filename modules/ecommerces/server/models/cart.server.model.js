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
 * Card Schema
 */
var schema = new Schema({
  user: { type: Schema.ObjectId, ref: 'User', required: true },
  municipality: { type: Schema.ObjectId, ref: 'Municipality', required: true },
  products: [{
    product: { type: Schema.ObjectId, ref: 'Product' },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 }
  }],

  // 小計 - total
  subtotal: { type: Number, default: 0 },
  // ポイント利用
  points_used: { type: Number, default: 0 },
  // 合計支払額 / paid amount = subtotal - points_used
  total_amount: { type: Number, default: 0 },

  is_order: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
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

mongoose.model('Cart', schema);
