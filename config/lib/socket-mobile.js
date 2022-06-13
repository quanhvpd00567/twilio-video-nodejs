'use strict';

exports.initSocketMobile = function (sv) {
  var io = require('socket.io').listen(sv, { path: '/socket-order' });

  io.on('connection', function (socket) {
    // Connect to server success
    console.log('Socket:' + socket.id + ' connected');
    socket.on('Hi', function (data) {
      console.log('Hi From ', socket.id);
    });
  });

  global.socketMobile = io;
};
