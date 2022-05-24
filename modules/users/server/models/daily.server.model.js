'use strict';
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  Schema = mongoose.Schema;

var schema = new Schema({
  // key: YYYY/MM/DD
  date: { type: String, required: true },
  date_query: { type: Date, required: true },
  user: { type: Schema.ObjectId, ref: 'User', required: true },

  // 歩数
  steps: { type: Number, required: true },
  calories: { type: Number, required: true },

  // "events" : {
  //     ${comprojectId} : {
  //         "calories" : 4,
  //         "steps" : 2140
  //     }
  // },
  events: {},

  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
}, { autoCreate: true });
schema.plugin(paginate);
schema.pre('save', function (next) {
  next();
});

mongoose.model('Daily', schema);
