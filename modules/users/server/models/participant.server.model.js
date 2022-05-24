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
var participantSchema = new Schema({
  event: { type: Schema.ObjectId, ref: 'Event', required: true },
  comproject: { type: Schema.ObjectId, ref: 'Comproject', required: true },
  user: { type: Schema.ObjectId, ref: 'User', required: true },
  company: { type: Schema.ObjectId, ref: 'Company', required: true },
  municipality: { type: Schema.ObjectId, ref: 'Municipality', required: true },

  // 総歩数
  steps: { type: Number, default: 0 },
  // 合計ポイント
  point: { type: Number, default: 0 },
  // 合計金額
  amount: { type: Number, default: 0 },

  rank: { type: Number },

  rank_growth_rate: { type: Number },
  growth_rate_percent: { type: Number },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });

participantSchema.plugin(paginate);
participantSchema.plugin(mongooseAggregatePaginate);
participantSchema.pre('save', function (next) {
  next();
});

participantSchema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};

mongoose.model('Participant', participantSchema);
