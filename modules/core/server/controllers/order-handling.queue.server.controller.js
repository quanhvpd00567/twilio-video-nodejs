'use strict';
var path = require('path'),
  eventEmitterServerController = require(path.resolve('./modules/core/server/controllers/event-emitter.server.controller')),
  Queue = require('queue'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  orderHandlingQueue = new Queue({ autostart: true, concurrency: 1 });

const eventEmitter = eventEmitterServerController.getEventEmitter();

orderHandlingQueue.on('success', (result) => {
  console.log('success result', result);
  eventEmitter.emit('order_response', { jobId: result.queueNumber, result });
});
orderHandlingQueue.on('error', (result) => {
  console.log('error result', result);
  logger.info('Queue error');
  eventEmitter.emit('order_response', { jobId: result && result.queueNumber, result: { success: false } });
});
orderHandlingQueue.on('timeout', (result) => {
  console.log('timeout result', result);
  logger.info('Queue timeout');
  eventEmitter.emit('order_response', { jobId: result && result.queueNumber, result: { success: false } });
});

module.exports = {
  getOrderHandlingQueue: function () {
    return orderHandlingQueue;
  }
};
