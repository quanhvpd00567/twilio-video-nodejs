'use strict';

const CronJob = require('cron').CronJob;
const clear_export = require('../jobs/clear-export');
const change_config = require('../jobs/change-config');

var clear_export_job = new CronJob({
  cronTime: '0 0 0 1 *',
  // cronTime: '0 * * * *',
  // cronTime: '* * * * *',
  onTick: function () {
    clear_export.excute();
  },
  start: false,
  timeZone: 'Asia/Tokyo'
});

// Run 0:0:1 every day
var cron_start_of_day = new CronJob({
  cronTime: '01 00 00 * * *',
  onTick: function () {
    change_config.execute();
  },
  start: false,
  timeZone: 'Asia/Tokyo'
});

function start() {
  clear_export_job.start();
  cron_start_of_day.start();
}
exports.start = start;
