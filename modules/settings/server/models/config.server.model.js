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

  // 利用規約
  term: { type: String },

  // プライバシーポリシー
  policy: { type: String },

  // resolutions:
  resolutions: [
    { type: String }
  ],
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

