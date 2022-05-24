'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  paginate = require('mongoose-paginate-v2'),
  crypto = require('crypto'),
  Schema = mongoose.Schema;

/**
 * Device Schema
 */
var DeviceSchema = new Schema({
  uuid: { type: String, unique: true },
  registrationId: { type: String },
  // Auto gen 12 chars
  code: { type: String, required: true },
  os: { type: String },
  // Last login
  time: { type: Date },
  token: { type: String },
  notification_count: { type: Number, default: 0 },
  version: { type: String, default: '' },
  user: { type: Schema.ObjectId, ref: 'User' },
  info: {
    ApplicationName: { type: String },
    BatteryLevel: { type: Number },
    Brand: { type: String },
    BuildNumber: { type: Number },
    BundleId: { type: String },
    Carrier: { type: String },
    DeviceId: { type: String },
    DeviceName: { type: String },
    FontScale: { type: Number },
    FreeDiskStorage: { type: String },
    IPAddress: { type: String },
    MACAddress: { type: String },
    Manufacturer: { type: String },
    Model: { type: String },
    ReadableVersion: { type: String },
    SystemName: { type: String },
    SystemVersion: { type: String },
    TotalDiskCapacity: { type: String },
    TotalMemory: { type: String },
    UniqueID: { type: String },
    UserAgent: { type: String },
    Version: { type: String },
    isEmulator: { type: String },
    isTablet: { type: String }
  },
  created: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  updated: { type: Date }
});
DeviceSchema.plugin(paginate);

DeviceSchema.statics.createToken = function () {
  return crypto.randomBytes(64).toString('hex');
};

mongoose.model('Device', DeviceSchema);
