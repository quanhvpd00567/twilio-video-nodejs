'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema;

/**
 * QA Schema - お知らせ
 */
var qaSchema = new Schema({
  // 質問
  question: { type: String, required: true },
  // 回答
  answer: { type: String, required: true },

  // 表示順
  display_order: { type: Number, required: true },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });
qaSchema.plugin(paginate);
qaSchema.plugin(mongooseAggregatePaginate);
qaSchema.pre('save', function (next) {
  next();
});

qaSchema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};
mongoose.model('QA', qaSchema);

