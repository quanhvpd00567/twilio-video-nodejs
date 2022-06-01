'use strict';

const CronJob = require('cron').CronJob;
const clear_export = require('../jobs/clear-export');

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

function start() {
  clear_export_job.start();
}
exports.start = start;
