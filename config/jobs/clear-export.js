'use strict';

var _ = require('lodash'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  fs = require('fs');

exports.excute = function () {
  var folders = [
    config.uploads.ranks.excel.export,
    config.uploads.surveys.excel.export,
    config.uploads.turns.excel.export,
    config.uploads.teams.excel.export
  ];
  clears(folders)
    .then(function () {
      console.log('DONE JOB CLEAR');
    })
    .catch(function (err) {
      console.log('ERROR JOB CLEAR:', err);
    });
};

function clears(folders) {
  var promises = [];
  folders.forEach(folder => {
    promises.push(clear_folder(folder));
  });
  return Promise.all(promises);
}

function clear_folder(dirname) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirname, (err, files) => {
      if (err || files.length === 0)
        resolve(true);

      _.forEach(files, function (file) {
        var filePath = path.join(dirname, file);
        fs.stat(filePath, function (err, stats) {
          if (err) {
            console.log(err.toString());
          }
          if (stats.isFile()) {
            fs.unlink(filePath, function (err) {
              if (err) {
                console.log(err);
              }
            });
          }
        });
      });
      resolve(true);
    });
  });
}
