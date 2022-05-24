'use strict';

var mongoose = require('mongoose'),
  moment = require('moment-timezone'),
  Config = mongoose.model('Config'),
  ConfigLog = mongoose.model('ConfigLog'),
  ConfigSet = mongoose.model('ConfigSet'),
  Event = mongoose.model('Event'),
  Comproject = mongoose.model('Comproject'),
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller'));

exports.execute = function () {
  change_config();
};

async function change_config() {
  try {
    console.info('Runing job: change_config');
    const current = moment();
    const condition = {
      deleted: false,
      is_applied: false,
      $and: [
        {
          $or: [
            { pps_apply_start_date: { $lte: current } },
            { donation_amount_apply_start_date: { $lte: current } }
          ]
        }
      ]
    };
    const [configObject, configSets] = await Promise.all([
      Config.findOne({}),
      ConfigSet.find(condition)
    ]);
    if (!configSets || configSets.length === 0) {
      return;
    }

    for (const configSet of configSets) {
      if (configSet.type === constants.CONFIG_SET_TYPE.PPS) {
        // Change pps
        if (configSet.pps_apply_start_date && moment(configSet.pps_apply_start_date) <= current) {
          const configUpdate = {
            pps: configSet.pps,
            pps_applied_date: moment(configSet.pps_apply_start_date)
          };
          await Promise.all([
            Config.updateOne({}, configUpdate),
            ConfigLog.create({
              pps_old: configObject.pps,
              pps_new: configSet.pps,
              pps_apply_start_date: configSet.pps_apply_start_date
            }),
            ConfigSet.updateOne({ _id: configSet._id }, { is_applied: true })
          ]);
        }
      }

      if (configSet.type === constants.CONFIG_SET_TYPE.APS) {
        // Change minimum_donation_amount and aps
        if (configSet.donation_amount_apply_start_date && moment(configSet.donation_amount_apply_start_date) <= current) {
          let configUpdate = {
            minimum_donation_amount: configSet.minimum_donation_amount,
            aps: configSet.aps,
            donation_amount_applied_date: moment(configSet.donation_amount_apply_start_date)
          };
          await Promise.all([
            Config.updateOne({ _id: configObject._id }, configUpdate),
            ConfigLog.create({
              minimum_donation_amount_old: configObject.minimum_donation_amount,
              minimum_donation_amount_new: configSet.minimum_donation_amount,
              aps_old: configObject.aps,
              aps_new: configSet.aps,
              donation_amount_apply_start_date: configSet.donation_amount_apply_start_date
            }),
            ConfigSet.updateOne({ _id: configSet._id }, { is_applied: true })
          ]);
        }
      }
    }

    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
}
