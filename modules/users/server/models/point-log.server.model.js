'use strict';
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  Schema = mongoose.Schema,
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  POINT_LOG_TYPES = Object.keys(constants.POINT_LOG_TYPE).map(key => constants.POINT_LOG_TYPE[key]);

var schema = new Schema({
  user: { type: Schema.ObjectId, ref: 'User', required: true },
  type: { type: Number, required: true, enum: POINT_LOG_TYPES },

  project: { type: Schema.ObjectId, ref: 'Project' },
  municipality: { type: Schema.ObjectId, ref: 'Municipality' },

  // 注文
  order: { type: Schema.ObjectId, ref: 'Order' },

  // ポイント
  points: { type: Number, required: true },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });
schema.plugin(paginate);
schema.pre('save', function (next) {
  next();
});

mongoose.model('PointLog', schema);
