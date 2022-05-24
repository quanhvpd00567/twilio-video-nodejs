'use strict';

var mongoose = require('mongoose'),
  Using = mongoose.model('Using'),
  path = require('path'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller'));

exports.execute = function () {
  delete_using();
};

async function delete_using() {
  try {
    console.info('Runing job: delete_using');
    const current = new Date();
    const condition = {
      deleted: false,
      end: { $lt: current }
    };

    let usings = await Using.find(condition);
    if (usings.length === 0) {
      return;
    }

    const deleteUsingPromises = usings.map(item => {
      item.deleted = true;
      return item.save();
    });
    await Promise.all(deleteUsingPromises);

    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
}
