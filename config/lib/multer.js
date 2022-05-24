'use strict';

var docFileType = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'application/x-pdf',
  'application/pdf',
  'pdf',
  '.pdf',
  'vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'msword',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

var imageType = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/gif'
];
module.exports.fileFilter = function (req, file, callback) {
  if (docFileType.indexOf(file.mimetype) < 0) {
    var err = new Error();
    err.code = 'UNSUPPORTED_MEDIA_TYPE';
    return callback(err, false);
  }
  callback(null, true);
};

module.exports.imageFileFilter = function (req, file, callback) {
  if (imageType.indexOf(file.mimetype) < 0) {
    var err = new Error();
    err.code = 'UNSUPPORTED_MEDIA_TYPE';
    return callback(err, false);
  }
  callback(null, true);
};
