'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  fs = require('fs'),
  sizeOf = require('image-size'),
  dateFormat = require('dateformat'),
  moment = require('moment');

exports.setValue = function (worksheet, row, col, value, horizontal = 'left') {
  // define
  var borderTable = {
    top: { style: 'thin', color: { argb: '000000' } },
    bottom: { style: 'thin', color: { argb: '000000' } },
    right: { style: 'thin', color: { argb: '000000' } },
    left: { style: 'thin', color: { argb: '000000' } }
  };
  var fontBody = { name: 'メイリオ', size: 11, bold: false };
  var normalStyle = { vertical: 'middle', horizontal: horizontal, wrapText: true };
  // setting
  var rowObj = worksheet.getRow(row);
  rowObj.getCell(col).style = {};
  rowObj.getCell(col).border = borderTable;
  rowObj.getCell(col).font = fontBody;
  rowObj.getCell(col).alignment = normalStyle;
  rowObj.getCell(col).value = value;
  rowObj.commit();
};

/**
 * delete Old File
 */
exports.deleteOldFile = function (existingFileUrl) {
  return new Promise(function (resolve, reject) {
    if (existingFileUrl) {
      fs.unlink(path.resolve(existingFileUrl), function (unlinkError) {
        if (unlinkError) {
          // If file didn't exist, no need to reject promise
          if (unlinkError.code === 'ENOENT') {
            return resolve();
          }
          resolve();
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }

  });
};

exports.formatDate = function (datetime, type) {
  if (!datetime) {
    return '';
  }

  moment.locale('ja');
  if (type === 1) {
    // yyyy年mm月dd日 hh:MM
    return moment(datetime).format('LLL');
  } else {
    // yyyy年mm月dd日 hh:MM:ss
    var date = moment(datetime);
    return date.format('ll') + ' ' + date.format('LTS');
  }
};

exports.addImage = function (workbook, filename) {
  return workbook.addImage({
    filename: '.' + filename,
    extension: path.extname(filename).substr(1)
  });
};

exports.getDimension = function (filename, colS, colE, rowS, rowE, widthCol, heightRow) {
  rowS = rowS - 1;
  rowE = rowE - 1;
  var dimensions = sizeOf(filename);
  var width = dimensions.width;
  var height = dimensions.height;
  var maxWidth = (colE - colS) * widthCol;
  var maxHeight = (rowE - rowS) * heightRow;
  var imageObj = { width: maxWidth, height: maxHeight };
  var isBaseMaxWidth = false;

  if (width > height) {
    imageObj.width = maxWidth;
    imageObj.height = maxWidth * height / width;
    isBaseMaxWidth = true;
    if (imageObj.height > maxHeight) {
      imageObj.width = maxHeight * width / height;
      imageObj.height = maxHeight;
      isBaseMaxWidth = false;
    }
  } else {
    imageObj.width = maxHeight * width / height;
    imageObj.height = maxHeight;
    isBaseMaxWidth = false;
    if (imageObj.width > maxWidth) {
      imageObj.width = maxWidth;
      imageObj.height = maxWidth * height / width;
      isBaseMaxWidth = true;
    }
  }

  var totalCol = imageObj.width / widthCol;
  var totalRow = imageObj.height / heightRow;
  var cotdu = 0;
  if (!isBaseMaxWidth) {
    var du = (maxWidth - imageObj.width);
    cotdu = Math.floor(du / widthCol / 2);
  }

  rowE = rowS + totalRow;
  colS = colS + cotdu;
  colE = colS + totalCol;
  return {
    tl: { col: colS, row: rowS },
    br: { col: colE, row: rowE }
  };
};
