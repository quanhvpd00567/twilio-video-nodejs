'use strict';
var path = require('path'),
  Queue = require('queue'),
  orderHandlingQueue = new Queue({ autostart: true, concurrency: 1 });

orderHandlingQueue.on('success', (result) => {
  console.log('success result', result);
  global.io.emit('order_response', { jobId: result.queueNumber, result });
});
orderHandlingQueue.on('error', (result) => {
  console.log('error result', result);
  global.io.emit('order_response', { jobId: result && result.queueNumber, result: { success: false } });
});
orderHandlingQueue.on('timeout', (result) => {
  console.log('timeout result', result);
  global.io.emit('order_response', { jobId: result && result.queueNumber, result: { success: false } });
});

module.exports = {
  getOrderHandlingQueue: function () {
    return orderHandlingQueue;
  }
};
