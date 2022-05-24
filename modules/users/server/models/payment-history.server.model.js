'use strict';
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  Schema = mongoose.Schema;

var schema = new Schema({
  municipality: { type: Schema.ObjectId, ref: 'Municipality', required: true },
  year_month: { type: String, required: true },

  is_paid: { type: Boolean, default: false },
  points: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },

  payment_date: { type: Date },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });
schema.plugin(paginate);
schema.pre('save', function (next) {
  next();
});

mongoose.model('PaymentHistory', schema);
