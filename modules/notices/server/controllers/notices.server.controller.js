'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Notice = mongoose.model('Notice'),
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  config = require(path.resolve('./config/config')),
  moment = require('moment-timezone'),
  Excel = require('exceljs'),
  _ = require('lodash'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  filesServerController = require(path.resolve('./modules/core/server/controllers/files.server.controller'));

mongoose.Promise = require('bluebird');

exports.create = async function (req, res) {
  try {
    let data = req.body;
    if (!data) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    data.start_time = new Date(new Date(data.start_time).setSeconds(0, 0));
    data.end_time = new Date(new Date(data.end_time).setSeconds(0, 0));
    let notice = new Notice(data);
    await notice.save();
    return res.json(notice);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.paging = async function (req, res) {
  try {
    var condition = req.body.condition || {};
    var page = condition.page || 1;
    var query = getQuery(condition);
    var sort = help.getSort(condition);
    var limit = help.getLimit(condition);
    const options = {
      sort: sort,
      page: page,
      limit: limit,
      collation: { locale: 'ja' },
      populate: [
        { path: 'municipalities', select: 'name' },
        { path: 'companies', select: 'name kind' }
      ]
    };
    const result = await Notice.paginate(query, options);
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.detail = async function (req, res) {
  try {
    const noticeId = req.params.noticeId;
    const result = await Notice.findOne({ deleted: false, _id: noticeId })
      .populate([
        { path: 'municipalities', select: 'name' },
        { path: 'companies', select: 'name kind' }
      ])
      .lean();

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.read = function (req, res) {
  res.json(req.model);
};

exports.update = async function (req, res) {
  try {
    var notice = req.model;

    const objectNotice = await Notice.findOne({ deleted: false, _id: notice._id }).lean();
    if (!objectNotice) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'notice.server.error.not_found') });
    }

    if (new Date(objectNotice.start_time) <= new Date()) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'notice.form.server.error.status_changed') });
    }

    req.body.start_time = new Date(new Date(req.body.start_time).setSeconds(0, 0));
    req.body.end_time = new Date(new Date(req.body.end_time).setSeconds(0, 0));
    notice = _.extend(notice, req.body);
    await notice.save();

    return res.json(notice);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.stop = async function (req, res) {
  let session = await mongoose.startSession();
  session.startTransaction();

  try {
    const noticeId = req.body && req.body.noticeId;
    if (!noticeId) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    const today = new Date();
    await Notice.updateOne({ _id: noticeId }, { end_time: today }, { session });

    await session.commitTransaction();
    session.endSession();

    return res.json(true);
  } catch (error) {
    session.abortTransaction().then(() => {
      session.endSession();
    });
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  let session = await mongoose.startSession();
  session.startTransaction();

  try {
    let notice = req.model;
    await Notice.updateOne({ _id: notice._id }, { deleted: true }).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.json(notice);
  } catch (error) {
    session.abortTransaction().then(() => {
      session.endSession();
    });

    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.export = async function (req, res) {
  try {
    const params = req.query;
    const query = getQuery(params);
    const sort = help.getSort(params);
    const notices = await Notice.find(query).sort(sort);

    const FILE_EXT = '.xlsx';
    const TEMPLATE_PATH = config.uploads.notices.excel.template;
    const OUT_FILE_PATH = config.uploads.notices.excel.export;
    const FILE_NAME = 'タッタカくん_お知らせ一覧_サンプル';
    const strtime = moment().format('YYYYMMDDHHmmss');
    const outputExcelFileName = OUT_FILE_PATH + FILE_NAME + '_' + strtime + FILE_EXT;
    const CURRENT_SHEET = 'お知らせ一覧';

    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);
    var wsExport = workbook.getWorksheet(CURRENT_SHEET);
    var row = 2;

    notices.forEach((item, index) => {
      filesServerController.setValue(wsExport, row, 1, index + 1, 'center');
      filesServerController.setValue(wsExport, row, 2, item.title);
      filesServerController.setValue(wsExport, row, 3, item.content);
      filesServerController.setValue(wsExport, row, 4, item.image ? item.image : '');
      filesServerController.setValue(wsExport, row, 5, moment(item.start_time).format('YYYY/MM/DD HH:mm'), 'center');
      filesServerController.setValue(wsExport, row, 6, moment(item.end_time).format('YYYY/MM/DD HH:mm'), 'center');
      row++;
    });

    await workbook.xlsx.writeFile(outputExcelFileName);

    return res.json({
      url: outputExcelFileName
    });

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.noticeByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  Notice.findById(id)
    .exec(function (err, notice) {
      if (err) {
        logger.error(err);
        return next(err);
      } else if (!notice) {
        return next(new Error('お知らせが見つかりません。'));
      }

      req.model = notice;
      next();
    });
};

/** ====== PRIVATE ========= */
function getQuery(condition) {
  var and_arr = [{ deleted: false }];
  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { title: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  const today = new Date();
  if (condition.delivery_status) {
    if (condition.delivery_status === 'undelivered') {
      and_arr.push({
        start_time: { $gt: today }
      });
    } else if (condition.delivery_status === 'during_delivery') {
      and_arr.push(
        { start_time: { $lte: today } },
        { end_time: { $gte: today } },
      );
    } else if (condition.delivery_status === 'expired') {
      and_arr.push(
        { end_time: { $lt: today } },
      );
    }
  }
  if (condition.target) {
    and_arr.push({ target: Number(condition.target) });
  }
  if (condition.created_min) {
    and_arr.push({ created: { '$gte': condition.created_min } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { '$lte': condition.created_max } });
  }
  if (condition.start_time_min) {
    and_arr.push({ start_time: { '$gte': condition.start_time_min } });
  }
  if (condition.start_time_max) {
    and_arr.push({ start_time: { '$lte': condition.start_time_max } });
  }
  if (condition.end_time_min) {
    and_arr.push({ end_time: { '$gte': condition.end_time_min } });
  }
  if (condition.end_time_max) {
    and_arr.push({ end_time: { '$lte': condition.end_time_max } });
  }
  return { $and: and_arr };
}
