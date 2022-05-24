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

  var AddressMaster = mongoose.model('AddressMaster');
  let existAddressMaster = AddressMaster.findOne()
    .exec((err, data) => {
      if (data === null) {
        const fileCsv = config.uploads.ecommerces.csv.template;
        let listData = [];
        fs.createReadStream(fileCsv)
          .pipe(csv(['code', 'code2', 'zipcode', 'prefecture_kana', 'city_kana', 'town_kana', 'prefecture', 'city', 'town']))
          .on('data', (row) => {
            listData.push(row);
          })
          .on('end', () => {
            AddressMaster.insertMany(listData).then(function () {
              console.log('Data inserted');
            }).catch(function (error) {
              console.log(error);
            });

            console.log('CSV file successfully processed');
          });
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

async function initEvent() {
  var Event = mongoose.model('Event');
  try {
    const condition = {
      deleted: false,
      $or: [
        { status: EVENT_STATUS.PREPARING },
        { status: EVENT_STATUS.OPENING },
        { status: EVENT_STATUS.CLOSED }
      ]
    };
    let event = await Event.findOne(condition).lean();
    if (!event) {
      event = await new Event().save();
    }
    console.log('Create event if not exist: ', event);
    return true;
  } catch (error) {
    console.log(error);
  }
}

function start() {
  initConfig();
  initFolder();
  // initEvent();
}
exports.start = start;
