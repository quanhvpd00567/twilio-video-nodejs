'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Order = mongoose.model('Order'),
  User = mongoose.model('User'),
  Municipality = mongoose.model('Municipality'),
  path = require('path'),
  _ = require('lodash'),
  config = require(path.resolve('./config/config')),
  moment = require('moment'),
  wanakana = require('wanakana'),
  Excel = require('exceljs'),
  fs = require('fs'),
  mailerServerUtil = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  filesServerController = require(path.resolve('./modules/core/server/controllers/files.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

const lang = 'ja';

/**
 * Handle get list event
 *
 * @param {*} req
 * @param {*} res
 */
exports.list = async function (req, res) {
  try {
    const auth = req.user;
    var condition = req.query || {};
    var page = condition.page || 1;
    var limit = help.getLimit(condition);
    var query = getQuery(condition, auth);
    condition.sort_column = 'number';
    var sort = help.getSort(condition);
    await Order.paginate(query, {
      page: page,
      sort: sort,
      populate: [
        {
          path: 'products.product',
          select: 'name'
        },
        {
          path: 'municipality',
          select: 'name fee'
        }
      ],
      limit: limit,
      collation: { locale: 'ja' }
    }).then(function (result) {
      return res.json(result);
    });

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.detail = async function (req, res) {
  try {
    return res.json(req.model);

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.exportOrder = async function (req, res) {
  try {
    let conditions = {};
    if (req.query.id) {
      conditions._id = req.query.id;
    }

    const FILE_EXT = '.xlsx';
    const TEMPLATE_PATH = config.uploads.order.excel.template_munic_order;
    const OUT_FILE_PATH = config.uploads.order.excel.exports;
    const FILE_NAME = '企業参加者一覧';
    // const strtime = moment().format('YYYYMMDDHHmmss');
    const outputExcelFileName = OUT_FILE_PATH + FILE_NAME + FILE_EXT;
    const CURRENT_SHEET = '注文一覧';
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);
    var wsExport = workbook.getWorksheet(CURRENT_SHEET);
    var row = 2;

    const auth = req.user;
    var condition = req.query || {};
    var query = getQuery(condition, auth);
    condition.sort_column = 'number';
    var sort = help.getSort(condition);

    let orders = await Order.find(query)
      .sort(sort)
      .populate({
        path: 'products.product'
      })
      .populate({
        path: 'location',
        select: 'code name'
      })
      .lean();

    let no = 1;
    orders.forEach((item, index) => {
      item.products.forEach((item2, index) => {
        for (let index = 0; index < item2.quantity; index++) {
          filesServerController.setValue(wsExport, row, 1, no, 'left');
          // 寄付番号
          filesServerController.setValue(wsExport, row, 2, item.number, 'left');
          // 電話番号;
          filesServerController.setValue(wsExport, row, 3, item.tel, 'left');
          // 郵便番号;
          filesServerController.setValue(wsExport, row, 4, item.zip_code, 'left');
          // 住所;
          filesServerController.setValue(wsExport, row, 5, item.prefecture + item.address + item.building, 'left');
          // 自治体ID;
          filesServerController.setValue(wsExport, row, 6, '', 'left');
          // 自治体名;
          filesServerController.setValue(wsExport, row, 7, '', 'left');
          // 導入施設ID;
          filesServerController.setValue(wsExport, row, 8, item.location.code, 'left');
          // 導入施設名;
          filesServerController.setValue(wsExport, row, 9, item.location.name, 'left');
          // 返礼品コード;
          filesServerController.setValue(wsExport, row, 10, item2.product.code, 'left');
          // 返礼品;
          filesServerController.setValue(wsExport, row, 11, item2.product.name, 'left');
          // 価格;
          filesServerController.setValue(wsExport, row, 12, item2.price, 'left');
          // 寄付日付;
          filesServerController.setValue(wsExport, row, 13, moment(item.created).format('YYYY/MM/DD'), 'left');
          no++;
          row++;
        }
      });
    });

    await workbook.xlsx.writeFile(outputExcelFileName);

    const promiseUpdate = orders.map(async item => {
      if (item.export_status === 1) {
        return await Order.findOneAndUpdate({ _id: item._id }, { export_status: 2, export_date: new Date });
      }
    });

    Promise.all([promiseUpdate])
      .then((values) => {
        return res.json({
          url: outputExcelFileName
        });
      });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.checkExported = async function (req, res) {
  try {
    const idOrder = req.query.id;
    const conditions = req.query;

    if (conditions.export_status !== '2' && !idOrder) {
      return res.json(null);
    }

    let query = { deleted: false, municipality: new mongoose.Types.ObjectId(req.user.municipality), export_status: 2 };
    if (idOrder) {
      query._id = conditions.id;
    }

    let data = await Order.findOne(query).lean();

    return res.json(data);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.memberById = function (req, res, next, id) {
  const auth = req.user;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  User.findOne({ _id: id, deleted: false, roles: { $in: [constants.ROLE.MUNIC_ADMIN, constants.ROLE.MUNIC_MEMBER] }, municipality: auth.municipality })
    .exec(function (err, event) {
      if (err) {
        logger.error(err);
        return next(err);
      } else if (!event) {
        return next(new Error('お知らせが見つかりません。'));
      }

      req.model = event;
      next();
    });
};

exports.adminExport = async function (req, res) {
  try {
    const auth = req.user;
    var condition = req.query || {};
    // var query = getQuery(condition, auth);
    condition.sort_column = 'number';
    // var sort = help.getSort(condition);

    const aggregates = getQueryAggregate(condition);
    Order.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }).then(result => {

      const timePrefix = Date.now().toString();
      const pathFile = config.uploads.order.csv.exports;
      const outFileCsv = pathFile + timePrefix + '_order_export.csv';
      let writeStream = fs.createWriteStream(outFileCsv);

      // set header to csv
      const headers = ['申込番号', '自治体', '寄付金額', '内ポイント金額', '決済手数料', '注文日'];
      writeStream.write(headers.join(',') + '\n', () => { });
      console.log(result[0]);
      result.forEach((someObject, index) => {
        let newLine = [];
        newLine.push('"' + someObject.number + '"');
        newLine.push('"' + someObject.municipality ? someObject.munic_name : '' + '"');
        newLine.push('"' + '¥' + someObject.total + '"');
        newLine.push('"' + '¥' + someObject.point + '"');
        newLine.push('"' + '¥' + getOrderFee(someObject) + '"');
        newLine.push('"' + moment(someObject.created).format('YYYY/MM/DD HH:mm') + '"');

        writeStream.write(newLine.join(',') + '\n', () => { });
      });

      writeStream.end();

      writeStream.on('finish', () => {
        console.log('finish write stream, moving along');
        const newOutputExcelFileName = outFileCsv.replace('./', '');
        // let fullUrl = config.system.domain + newOutputExcelFileName;
        return res.json({
          url: outFileCsv
        });
      }).on('error', (err) => {
        console.log(err);
      });
    });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }

  function getOrderFee(item) {
    if (!item.munic_fee || item.munic_fee === 0) {
      return 0;
    }

    return Math.floor((item.munic_fee * item.total) / 100);
  }
};

exports.adminList = async function (req, res) {
  const auth = req.user;
  var condition = req.query || {};
  var page = condition.page || 1;
  var limit = help.getLimit(condition);
  var options = { page: page, limit: limit };

  const aggregates = getQueryAggregate(condition);
  let result = await Order.aggregatePaginate(Order.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
  result = help.parseAggregateQueryResult(result, page);

  return res.json(result);
};

/** ====== PRIVATE ========= */
function getQuery(condition, auth) {
  var and_arr = [];
  if (help.isAdminOrSubAdmin(auth.roles)) {
    and_arr = [{ deleted: false }];
  } else {
    and_arr = [{ deleted: false, municipality: new mongoose.Types.ObjectId(auth.municipality) }];
  }

  if (condition.shingoren && condition.shingoren !== '') {
    var or_arr = [
      { last_name: { $regex: '.*' + condition.shingoren + '.*', $options: 'i' } },
      { first_name: { $regex: '.*' + condition.shingoren + '.*', $options: 'i' } },
      { last_name_kana: { $regex: '.*' + condition.shingoren + '.*', $options: 'i' } },
      { first_name_kana: { $regex: '.*' + condition.shingoren + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.id) {
    and_arr.push({ _id: condition.id });
  }

  if (condition.tel && condition.tel !== '') {
    and_arr.push({ tel: { $regex: '.*' + condition.tel + '.*', $options: 'i' } });
  }

  if (condition.number && condition.number !== '') {
    and_arr.push({ number: { $regex: '.*' + condition.number + '.*', $options: 'i' } });
  }

  if (condition.export_status && condition.export_status !== '') {
    and_arr.push({ export_status: condition.export_status });
  }

  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  return { $and: and_arr };
}

function trimAndLowercase(data) {
  if (!data) {
    return '';
  }

  data = data.trim();
  data = data && data.toLowerCase();

  return data;
}

function abortTransaction(session) {
  if (session) {
    session.abortTransaction().then(() => {
      session.endSession();
    });
  }
}

function formatZipcode(zipcode) {
  if (!zipcode)
    return '';

  if (zipcode.length >= 7) {
    return zipcode.substring(0, 3) + '-' + zipcode.substring(3, zipcode.length);
  }

  return zipcode;
}
function getQueryAggregate(condition) {
  let and_arr = [{
    deleted: false
  }];

  if (condition.is_usage_system) {
    let arg = { $eq: 1 };
    if (condition.is_usage_system === '2') {
      arg = { $in: [null, 2] };
    }

    if (condition.is_usage_system === 'all') {
      arg = { $in: [null, 2, 1] };
    }

    and_arr.push({ is_usage_system: arg });
  }


  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  if (condition.number && condition.number !== '') {
    and_arr.push({ number: { $regex: '.*' + condition.number + '.*', $options: 'i' } });
  }


  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  // Match user
  let matchUser = {
    $and: [
      { 'munic.deleted': { $eq: false } }
    ]
  };

  aggregates.push({
    $lookup: {
      from: 'municipalities',
      localField: 'municipality',
      foreignField: '_id',
      as: 'munic'
    }
  }, {
    $unwind: '$munic'
  }, {
    $match: matchUser
  },
  {
    $addFields: {
      munic_id: { $convert: { input: '$munic._id', to: 'string' } },
      munic_name: { $convert: { input: '$munic.name', to: 'string' } },
      munic_fee: '$munic.fee'
    }
  }
  );

  let second_and_arr = [];
  if (condition.munic_name && condition.munic_name !== '') {
    second_and_arr.push({ munic_name: { $regex: '.*' + condition.munic_name + '.*', $options: 'i' } });
  }

  if (second_and_arr.length > 0) {
    aggregates.push({
      $match: {
        $or: second_and_arr
      }
    });
  }

  aggregates.push({
    $project: {
      number: 1,
      total: 1,
      point: 1,
      created: 1,
      munic_name: 1,
      munic_fee: 1,
      munic_id: 1
    }
  });

  const sort = help.getSortAggregate(condition);
  if (sort) {
    aggregates.push({
      $sort: sort
    });
  }

  return aggregates;
}
