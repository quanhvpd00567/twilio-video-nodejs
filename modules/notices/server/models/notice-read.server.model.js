'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  Schema = mongoose.Schema;

var NoticeReadSchema = new Schema({
  notice: { type: Schema.ObjectId, ref: 'Notice' },
  user: { type: Schema.ObjectId, ref: 'User' },

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false }
}, { autoCreate: true });
NoticeReadSchema.plugin(paginate);
NoticeReadSchema.pre('save', function (next) {
  next();
});

mongoose.model('NoticeRead', NoticeReadSchema);
