'use strict';
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  Schema = mongoose.Schema,
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  TRANSACTION_STATUSES = Object.keys(constants.TRANSACTION_STATUS).map(key => constants.TRANSACTION_STATUS[key]);

var schema = new Schema({
  user: { type: Schema.ObjectId, ref: 'User', required: true },
  card: { type: Schema.ObjectId, ref: 'Card' },
  // order: { type: Schema.ObjectId, ref: 'Order', required: true },

  amount: { type: Number, default: 0 },
  status: { type: Number, enum: TRANSACTION_STATUSES },
  error: { type: String },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false }
}, { autoCreate: true });
schema.plugin(paginate);
schema.pre('save', function (next) {
  next();
});

mongoose.model('Transaction', schema);
