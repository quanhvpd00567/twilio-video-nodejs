'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  Schema = mongoose.Schema;

/**
 * Setting Schema
 */
var settingschema = new Schema({
  tax: { type: Number },
  updated: { type: Date, default: Date.now }
});

settingschema.plugin(paginate);
// settingschema.plugin(relationship, { relationshipPathName: 'system' });

settingschema.pre('save', function (next) {
  next();
});

settingschema.statics.common = function () {
  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};
mongoose.model('Setting', settingschema).createCollection();

