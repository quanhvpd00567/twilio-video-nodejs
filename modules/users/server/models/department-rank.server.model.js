'use strict';
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  Schema = mongoose.Schema;

var schema = new Schema({
  company: { type: Schema.ObjectId, ref: 'Company', required: true },
  subsidiary: { type: Schema.ObjectId, ref: 'Subsidiary', required: true },
  department: { type: Schema.ObjectId, ref: 'Department', required: true },
  event: { type: Schema.ObjectId, ref: 'Event', required: true },

  rank: { type: Number, required: true },
  average_steps: { type: Number, required: true },
  total_steps: { type: Number },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });
schema.plugin(paginate);
schema.pre('save', function (next) {
  next();
});

mongoose.model('DepartmentRank', schema);
