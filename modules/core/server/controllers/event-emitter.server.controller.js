'use strict';
var EventEmitter = require('events');
const eventEmitter = new EventEmitter();

module.exports = {
  getEventEmitter: function () {
    return eventEmitter;
  }
};
