'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  crypto = require('crypto'),
  multer = require('multer'),
  moment = require('moment'),
  thumb = require('node-thumbnail').thumb,
  fs = require('fs'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller'));

exports.createImage = function (path, input, number, suffix) {
  return new Promise((resolve, reject) => {
    if (input) {
      var data = input.replace(/^data:image\/\w+;base64,/, '');
      var fileName = path + number;
      if (suffix) {
        fileName += '_' + suffix;
      }
      fileName += '.jpg';
      fs.writeFile(fileName, data, {
        encoding: 'base64',
        mode: '777'
      }, function (err) {
        if (err) {
          reject(err);
        } else {
          fs.chmodSync(fileName, '777');
          fileName = fileName.substr(1);
          resolve(fileName);
        }
      });
    } else {
      resolve('');
    }
  });
};

exports.createThumb = function (path, input, type) {
  console.log('TCL: exports.createThumb -> input', input);
  return new Promise(function (resolve, reject) {
    var medium = {
      suffix: '_medium',
      width: 375
    };
    var small = {
      suffix: '_small',
      width: 115
    };
    var tiny = {
      suffix: '_tiny',
      width: 50
    };
    // var options = { responseType: 'base64', jpegOptions: 75, width: 320, height: 180 };
    var options = {
      prefix: '',
      digest: false,
      hashingType: 'sha1', // 'sha1', 'md5', 'sha256', 'sha512'
      concurrency: 1,
      quiet: false, // if set to 'true', console.log status messages will be supressed
      overwrite: true,
      skip: false, // Skip generation of existing thumbnails
      basename: undefined, // basename of the thumbnail. If unset, the name of the source file is used as basename.
      ignore: false, // Ignore unsupported files in "dest",
      source: input,
      destination: path,
      logger: function (message) {
        console.log(message);
      }
    };

    if (type === 'small') {
      options.suffix = small.suffix;
      options.width = small.width;
    } else if (type === 'medium') {
      options.suffix = medium.suffix;
      options.width = medium.width;
    } else {
      options.suffix = tiny.suffix;
      options.width = tiny.width;
    }

    thumb(options)
      .then(function () {
        var filename = input.replace(/(\.[\w\d_-]+)$/i, options.suffix + '$1').substr(1);
        resolve(filename);
      })
      .catch((error) => {
        reject(error);
      });

  });
};

exports.uploadImage = function (config, name, req, res) {
  return new Promise(function (resolve, reject) {
    var upload = multer(config).single(name);
    var imageFileFilter = require(path.resolve('./config/lib/multer')).imageFileFilter;
    upload.fileFilter = imageFileFilter;

    upload(req, res, function (err) {
      if (err) {
        reject(err);
      }
      const originalName = req.file && req.file.originalname;
      const fileExtension = originalName && originalName.split('.').pop();
      if (originalName && fileExtension) {
        var imageUrl = config.dest + Date.now() + '.' + fileExtension;
        fs.rename(req.file.path, imageUrl, (err) => {
          if (err) {
            reject(err);
          }
          resolve({ image: imageUrl.substr(1) });
        });
      } else {
        reject({ message: 'サーバーでエラーが発生しました。' });
      }
    });
  });
};

exports.uploadMultiImages = function (config, name, req, res) {
  return new Promise(function (resolve, reject) {
    const pictures_path = createPicturePathIfNotExisting(config);

    var upload = multer({ dest: pictures_path }).array(name);
    var imageFileFilter = require(path.resolve('./config/lib/multer')).imageFileFilter;
    upload.fileFilter = imageFileFilter;

    upload(req, res, function (err) {
      if (err) {
        reject(err);
      }

      if (req.files[0] && req.files[0].originalname) {
        const timePrefix = Date.now().toString();
        var imageUrl = pictures_path + `${timePrefix}_${req.files[0].originalname}`;
        fs.rename(req.files[0].path, imageUrl, (err) => {
          if (err) {
            reject(err);
          }
          resolve({ imageName: req.files[0].originalname, timePrefix, imagePathFolder: pictures_path.replace('./', '/'), imageUrl: imageUrl.substr(1) });
        });
      } else {
        reject({ message: 'サーバーでエラーが発生しました。' });
      }
    });
  });
};

exports.uploadImageCustomPath = function (config, name, req, res) {
  return new Promise(function (resolve, reject) {
    var upload = multer(config).single(name);
    var imageFileFilter = require(path.resolve('./config/lib/multer')).imageFileFilter;
    upload.fileFilter = imageFileFilter;

    upload(req, res, function (err) {
      if (err) {
        reject(err);
      }
      const pictures_path = createPicturePathIfNotExisting(config);
      const timePrefix = Date.now().toString();
      const originalName = req.file && req.file.originalname;
      const fileExtension = originalName && originalName.split('.').pop();

      if (originalName && fileExtension) {
        var imageUrl = pictures_path + `${timePrefix}_${originalName}`;
        fs.rename(req.file.path, imageUrl, (err) => {
          if (err) {
            reject(err);
          }
          resolve({ image_url: imageUrl.substr(1), timePrefix: timePrefix, image_name: originalName, imagePathFolder: pictures_path.replace('./', '/') });
        });
      } else {
        reject({ message: 'サーバーでエラーが発生しました。' });
      }
    });
  });
};

exports.uploadImageFromBase64 = function (config, base64, extension = '.png') {
  try {
    const pictures_path = createPicturePathIfNotExisting(config);
    var imageUrl = pictures_path + Date.now() + extension;
    fs.writeFileSync(imageUrl, base64, 'base64');

    return imageUrl.substr(1);
  } catch (error) {
    logger.error(error);
    return false;
  }
};

function createPicturePathIfNotExisting(config) {
  const folder = moment().format('YMD');
  const parentFolder = config.dest;
  // if parent folder exists
  if (!fs.existsSync(parentFolder)) {
    fs.mkdirSync(parentFolder);
  }

  // folder image
  const pictures_path = parentFolder + folder + '/';
  if (!fs.existsSync(pictures_path)) {
    fs.mkdirSync(pictures_path);
  }

  return pictures_path;
}


function createPicturePathIfNotExistingByFolder(config, folder) {
  const parentFolder = config.dest;
  // if parent folder exists
  if (!fs.existsSync(parentFolder)) {
    fs.mkdirSync(parentFolder);
  }

  // folder image
  const pictures_path = parentFolder + folder + '/';
  if (!fs.existsSync(pictures_path)) {
    fs.mkdirSync(pictures_path);
  }

  return pictures_path;
}
