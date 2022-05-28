'use strict';

var _ = require('lodash'),
  path = require('path'),
  EVENT_STATUS = require(path.resolve('./modules/core/server/shares/constants')).EVENT_STATUS,
  config = require('../config'),
  mongoose = require('mongoose'),
  csv = require('csv-parser'),
  fs = require('fs');

function initConfig() {
  var Config = mongoose.model('Config');
  Config.findOne().exec((err, conf) => {
    if (!conf) {
      const deep_link = config.app && config.app.deep_link || '';
      var new_conf = new Config({ version: new Date().getTime(), app: { deep_link: deep_link } });
      new_conf.save();
    }
  });
}

function initFolder() {
  var paths = [
  ];
  paths.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
}

function start() {
  initConfig();
  initFolder();
}
exports.start = start;
