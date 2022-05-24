'use strict';
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema;

var schema = new Schema({
  user: { type: Schema.ObjectId, ref: 'User', required: true },
  project: { type: Schema.ObjectId, ref: 'Project', required: true },
  comproject: { type: Schema.ObjectId, ref: 'Comproject', required: true },
  municipality: { type: Schema.ObjectId, ref: 'Municipality', required: true },
  participant: { type: Schema.ObjectId, ref: 'Participant', required: true },

  // ポイント
  points: { type: Number, required: true },
  expire: { type: Date, required: true },

  is_expired: { type: Boolean, default: false },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });

schema.plugin(paginate);
schema.plugin(mongooseAggregatePaginate);
schema.pre('save', function (next) {
  next();
});

mongoose.model('Point', schema);
