'use strict';
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  Schema = mongoose.Schema;

var schema = new Schema({
  user: { type: Schema.ObjectId, ref: 'User', required: true },
  event: { type: Schema.ObjectId, ref: 'User' },

  date: { type: String },
  steps: { type: Number },
  steps_event: { type: Number },

  start_time: { type: Date },
  end_time: { type: Date },

  // false: add into daily / true: ignore
  invalid_data: { type: Boolean, default: false },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });
schema.plugin(paginate);
schema.pre('save', function (next) {
  next();
});

mongoose.model('StepHistory', schema);
