'use strict';

const CronJob = require('cron').CronJob;
const clear_export = require('../jobs/clear-export');
const change_event_status = require('../jobs/change-event-status');
const push_user_joining_event = require('../jobs/push-user-joining-event');
const check_point_expire = require('../jobs/check-point-expire');
const delete_using = require('../jobs/delete-using');
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

// Run every minute
var cron_every_minute = new CronJob({
  cronTime: '* * * * *',
  onTick: function () {
    change_event_status.execute();
    check_point_expire.execute();
    delete_using.execute();
  },
  start: false,
  timeZone: 'Asia/Tokyo'
});

// Run 18:00:00 every day
var cron_6_pm = new CronJob({
  cronTime: '00 00 18 * * *',
  onTick: function () {
    push_user_joining_event.execute();
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
  cron_every_minute.start();
  cron_6_pm.start();
  cron_start_of_day.start();
}
exports.start = start;
