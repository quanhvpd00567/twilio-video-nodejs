'use strict';

var _ = require('lodash'),
  path = require('path'),
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

async function initMasterAddresses() {
  try {
    const MasterAddress = mongoose.model('MasterAddress');
    const isExisted = await MasterAddress.findOne({});
    if (isExisted) {
      console.log('Checked, master addresses already existed!');
      return true;
    }

    const fileCsv = config.uploads.core.csv.template;
    let addresses = [];
    fs.createReadStream(fileCsv)
      .pipe(csv(['code', 'code2', 'zipcode', 'prefecture_kana', 'city_kana', 'town_kana', 'prefecture', 'city', 'town']))
      .on('data', (row) => {
        addresses.push(row);
      })
      .on('end', () => {
        MasterAddress.insertMany(addresses).then(function () {
          console.log('Master addresses imported successfully!');
        }).catch(function (error) {
          console.log(error);
        });
      });
  } catch (error) {
    console.log(error);
  }
}

function start() {
  initMasterAddresses();
  initConfig();
  initFolder();
}
exports.start = start;
