'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  ComProject = mongoose.model('Comproject'),
  User = mongoose.model('User'),
  Participant = mongoose.model('Participant'),
  Daily = mongoose.model('Daily'),
  path = require('path'),
  _ = require('lodash'),
  config = require(path.resolve('./config/config')),
  fs = require('fs'),
  Excel = require('exceljs'),
  moment = require('moment-timezone'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  filesServerController = require(path.resolve('./modules/core/server/controllers/files.server.controller')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  helpMobile = require(path.resolve('./mobiles/controllers/help.mobile.controller'));

moment.tz.setDefault('Asia/Tokyo');
moment.locale('ja');
const lang = 'ja';

exports.list = async function (req, res) {
  try {
    const auth = req.user;

    var condition = req.query || {};
    var page = condition.page || 1;
    var limit = help.getLimit(condition);
    var options = { page: page, limit: limit };

    const role = auth.roles[0];
    const account = await User.findOne({ deleted: false, _id: auth._id }).lean();

    let and_arr = [{ deleted: false }];

    if (role === constants.ROLE.MUNIC_MEMBER || role === constants.ROLE.MUNIC_ADMIN) {
      and_arr.push({ municipality: account.municipality });
    }

    const aggregates = getQueryAggregate(condition, and_arr, role);
    let result = await ComProject.aggregatePaginate(ComProject.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.update = async function (req, res) {
  try {
    const comprojectId = req.params.comProjectId;
    let result = await ComProject.updateOne({ _id: comprojectId, deleted: false }, req.body);
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.detail = async function (req, res) {
  try {
    const id = req.params.comProjectId;
    let [comProject, numberOfParticipants] = await Promise.all([
      ComProject.findOne({ _id: id, deleted: false })
        .populate({ path: 'event' })
        .populate({ path: 'company', select: 'name kind' })
        .populate({ path: 'project', select: 'name' })
        .populate({ path: 'municipality', select: 'name' }).lean(),
      Participant.countDocuments({ deleted: false, comproject: id })
    ]);
    if (comProject) {
      comProject.number_of_participants = numberOfParticipants;
    }

    return res.json(comProject);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.paticipants = async function (req, res) {
  try {
    const id = req.params.comProjectId;
    const auth = req.user;
    var condition = req.query || {};
    var page = condition.page || 1;
    var limit = help.getLimit(condition);
    var options = { page: page, limit: limit };

    const aggregates = getQueryAggregateParicipant(condition, id);
    let result = await Participant.aggregatePaginate(Participant.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.paticipantsExport = async function (req, res) {
  try {
    const id = req.params.comProjectId;
    const auth = req.user;
    var condition = req.query || {};
    var options = {};

    const aggregates = getQueryAggregateParicipant(condition, id);
    let result = await Participant.aggregatePaginate(Participant.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);

    const FILE_EXT = '.xlsx';
    const TEMPLATE_PATH = config.uploads.com_projects.excel.template;
    const OUT_FILE_PATH = config.uploads.com_projects.excel.export;
    const FILE_NAME = '参加者一覧';
    // const strtime = moment().format('YYYYMMDDHHmmss');
    const outputExcelFileName = OUT_FILE_PATH + FILE_NAME + FILE_EXT;
    const CURRENT_SHEET = '参加者一覧';
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);

    var wsExport = workbook.getWorksheet(CURRENT_SHEET);
    var row = 2;

    result.data.forEach((item, index) => {
      for (let i = 1; i <= 7; i++) {
        filesServerController.setValue(wsExport, row, i, ' ');
      }

      // number
      filesServerController.setValue(wsExport, row, 1, item.user_number, 'left');
      // last_name
      filesServerController.setValue(wsExport, row, 2, item.last_name, 'left');
      // first_name
      filesServerController.setValue(wsExport, row, 3, item.first_name, 'left');
      // subsidiary
      filesServerController.setValue(wsExport, row, 4, item.subsidiary_number, 'left');
      // email
      filesServerController.setValue(wsExport, row, 5, item.user_email, 'left');
      // department
      filesServerController.setValue(wsExport, row, 6, item.department, 'left');
      // note
      filesServerController.setValue(wsExport, row, 7, item.note, 'left');

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

exports.exportWeeklyStepsReport = async function (req, res) {
  try {
    const excel = {
      dest: './modules/com_projects/client/excel/',
      template: './modules/com_projects/client/excel/templates/weekly_steps.xlsx',
      export: './modules/com_projects/client/excel/exports/'
    };

    // let beforeOneWeek = moment(moment().valueOf() - 7 * 24 * 60 * 60 * 1000);
    // let beforeOneWeek2 = moment(beforeOneWeek);
    // let day = beforeOneWeek.day();
    // let diffToMonday = beforeOneWeek.date() - day + (day === 0 ? -6 : 1);
    // let lastMonday = moment(beforeOneWeek.set('date', diffToMonday));
    // let lastSunday = moment(beforeOneWeek2.set('date', diffToMonday + 6));

    const { start, end } = req.body;
    if (!start || !end) {
      return res.status(422).send({ message: 'Please add start and end!' });
    }

    let lastMonday = moment(start).startOf('day');
    let lastSunday = moment(end).endOf('day');

    const [dailies, comprojects] = await Promise.all([
      Daily.find({
        deleted: false,
        $and: [{ date_query: { $gte: lastMonday } }, { date_query: { $lte: lastSunday } }]
      }).lean(),
      ComProject.find({
        deleted: false,
        $or: [
          { start: { $gte: lastMonday, $lte: lastSunday } },
          { end: { $gte: lastMonday, $lte: lastSunday } },
          { $and: [{ start: { $lte: lastMonday } }, { end: { $gte: lastSunday } }] }
        ]
      }).populate({ path: 'project', select: 'name' })
        .select('_id project').lean()
    ]);
    const comprojectIds = comprojects.map(item => item._id);
    const participants = await Participant.find({ deleted: false, comproject: { $in: comprojectIds } })
      .populate([
        { path: 'user', select: 'name nickname subsidiary department', populate: { path: 'subsidiary', select: 'name kind' } },
        { path: 'comproject', select: 'project start end', populate: { path: 'project', select: 'name' } }
      ]).lean();

    const FILE_EXT = '.xlsx';
    const TEMPLATE_PATH = excel.template;
    const OUT_FILE_PATH = excel.export;
    const FILE_NAME = 'steps';
    const outputExcelFileName = OUT_FILE_PATH + FILE_NAME + FILE_EXT;
    const CURRENT_SHEET = 'steps';
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);

    var wsExport = workbook.getWorksheet(CURRENT_SHEET);
    var row = 2;

    let weekIndex = 1;
    for (let d = moment(JSON.parse(JSON.stringify(lastMonday))); d <= lastSunday; d.set('date', d.date() + 1)) {
      wsExport.getColumn(weekIndex + 5).width = 13;
      filesServerController.setValue(wsExport, 1, weekIndex + 5, getDateColumn(d), 'right', 100);
      weekIndex++;
    }

    let records = [];
    participants.forEach(participant => {
      for (let d = moment(JSON.parse(JSON.stringify(lastMonday))); d <= lastSunday; d.set('date', d.date() + 1)) {
        const dateKey = helpMobile.getYYYYMMDDString(d);
        const daiRecord = dailies.find(daily => {
          return daily.user && participant.user && participant.comproject && daily.user.toString() === participant.user._id.toString() && daily.date === dateKey
            && moment(daily.date_query) > moment(participant.comproject.start) && moment(daily.date_query) < moment(participant.comproject.end);
        });
        participant[getDateColumn(d)] = daiRecord && daiRecord.steps && Math.round(daiRecord.steps) || 0;
      }
      records.push(participant);
    });

    records.forEach((item, index) => {
      filesServerController.setValue(wsExport, row, 1, item.user && item.user.name || '', 'left');
      filesServerController.setValue(wsExport, row, 2, item.user && item.user.nickname || '', 'left');
      filesServerController.setValue(wsExport, row, 3, item.user && item.user.subsidiary ? helpMobile.parseCompanyName(item.user.subsidiary.kind, item.user.subsidiary.name) : '', 'left');
      filesServerController.setValue(wsExport, row, 4, item.user && item.user.department || '', 'left');
      filesServerController.setValue(wsExport, row, 5, item.comproject && item.comproject.project && item.comproject.project.name || '', 'left');

      let weekIndex = 1;
      for (let d = moment(JSON.parse(JSON.stringify(lastMonday))); d <= lastSunday; d.set('date', d.date() + 1)) {
        const dateColumn = getDateColumn(d);
        filesServerController.setValue(wsExport, row, 5 + weekIndex, item[dateColumn] || 0, 'right');
        weekIndex++;
      }

      row++;
    });

    await workbook.xlsx.writeFile(outputExcelFileName);

    const newOutputExcelFileName = outputExcelFileName.replace('./', '');
    let fullUrl = config.system.domain + newOutputExcelFileName;
    return res.json(outputExcelFileName);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }

  function getDateColumn(date) {
    return moment(date).format('YYYY/MM/DD');
  }
};

exports.export = async function (req, res) {
  try {
    var condition = req.query || {};
    var page = condition.page || 1;
    var limit = help.getLimit(condition);
    var options = { page: page, limit: limit };
    const auth = req.user;
    const role = auth.roles[0];
    // const account = await User.findOne({ deleted: false, _id: auth._id }).lean();

    let and_arr = [{ deleted: false }];

    const aggregates = getQueryAggregate(condition, and_arr, role);
    let result = await ComProject.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' });
    const excel = {
      dest: './modules/com_projects/client/excel/',
      template: './modules/com_projects/client/excel/templates/all.xlsx',
      export: './modules/com_projects/client/excel/exports/'
    };


    if (condition.type === 'excel') {
      const FILE_EXT = '.xlsx';
      const TEMPLATE_PATH = excel.template;
      const OUT_FILE_PATH = excel.export;
      const FILE_NAME = '案件一覧';
      const outputExcelFileName = OUT_FILE_PATH + FILE_NAME + FILE_EXT;
      const CURRENT_SHEET = '案件一覧';
      const workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(TEMPLATE_PATH);

      var wsExport = workbook.getWorksheet(CURRENT_SHEET);
      var row = 2;

      result.forEach((item, index) => {
        // 社員No.
        filesServerController.setValue(wsExport, row, 1, item.number, 'left');
        // イベント名
        filesServerController.setValue(wsExport, row, 2, item.event_name ? item.event_name : '', 'left');
        // プロジェクト
        filesServerController.setValue(wsExport, row, 3, item.project_name, 'left');
        // 自治体
        filesServerController.setValue(wsExport, row, 4, item.municipality_name, 'left');
        // 寄付会社
        filesServerController.setValue(wsExport, row, 5, helpMobile.parseCompanyName(item.company_kind, item.company_name), 'left');
        // 寄付金額
        filesServerController.setValue(wsExport, row, 6, parseDonationAmount(item.total), 'left');
        // 開始日時
        filesServerController.setValue(wsExport, row, 7, moment(item.start).format('YYYY/MM/DD HH:mm'), 'left');
        // 終了日時
        filesServerController.setValue(wsExport, row, 8, moment(item.end).format('YYYY/MM/DD HH:mm'), 'left');
        row++;
      });

      await workbook.xlsx.writeFile(outputExcelFileName);

      // const newOutputExcelFileName = outputExcelFileName.replace('./', '');
      // let fullUrl = config.system.domain + newOutputExcelFileName;

      return res.json({
        url: outputExcelFileName
      });
    } else {
      const timePrefix = Date.now().toString();
      const pathFile = excel.export;
      const outFileCsv = pathFile + timePrefix + '_案件一覧.csv';
      let writeStream = fs.createWriteStream(outFileCsv);

      // set header to csv
      const headers = ['案件No.', 'イベント名', 'プロジェクト', '自治体', '寄付会社',	'寄付金額',	'開始日時',	'終了日時'];
      writeStream.write(headers.join(',') + '\n', () => { });

      result.forEach((someObject, index) => {
        let newLine = [];
        newLine.push('"' + someObject.number + '"');
        newLine.push('"' + someObject.event_name ? someObject.event_name : '' + '"');
        newLine.push('"' + someObject.project_name + '"');
        newLine.push('"' + someObject.municipality_name + '"');
        newLine.push('"' + helpMobile.parseCompanyName(someObject.company_kind, someObject.company_name) + '"');
        newLine.push('"' + parseDonationAmount(someObject.total) + '"');
        newLine.push('"' + moment(someObject.start).format('YYYY/MM/DD HH:mm') + '"');
        newLine.push('"' + moment(someObject.end).format('YYYY/MM/DD HH:mm') + '"');

        writeStream.write(newLine.join(',') + '\n', () => {});
      });

      writeStream.end();

      writeStream.on('finish', () => {
        console.log('finish write stream, moving along');
        // const newOutputExcelFileName = outFileCsv.replace('./', '');
        // let fullUrl = newOutputExcelFileName;

        return res.json({
          url: outFileCsv
        });
      }).on('error', (err) => {
        console.log(err);
      });
    }


  } catch (error) {
    console.log(error);
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

/** ====== PRIVATE ========= */
function getQueryAggregate(condition, and_arr, role) {
  if (condition.status && condition.status !== '') {
    and_arr.push({ status: { $eq: Number(condition.status) } });
  }
  if (condition.pay_status && condition.pay_status !== '') {
    and_arr.push({ pay_status: { $eq: Number(condition.pay_status) } });
  }
  if (condition.method && condition.method !== '') {
    and_arr.push({ method: { $eq: Number(condition.method) } });
  }
  if (condition.send_status && condition.send_status !== '') {
    and_arr.push({ send_status: { $eq: Number(condition.send_status) } });
  }

  if (condition.start_time_min) {
    and_arr.push({ start: { '$gte': new Date(condition.start_time_min) } });
  }
  if (condition.start_time_max) {
    and_arr.push({ start: { '$lte': new Date(condition.start_time_max) } });
  }
  if (condition.end_time_min) {
    and_arr.push({ end: { '$gte': new Date(condition.end_time_min) } });
  }
  if (condition.end_time_max) {
    and_arr.push({ end: { '$lte': new Date(condition.end_time_max) } });
  }
  if (condition.created_min) {
    and_arr.push({ created: { '$gte': new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { '$lte': new Date(condition.created_max) } });
  }

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  // Match municipality
  let matchMunic = {
    $and: [
      // { 'municipality.deleted': { $eq: false } },
      {
        $or: [
          { 'municipality.is_testing': null },
          { 'municipality.is_testing': false }
        ]
      }
    ]
  };
  // relation to municipality
  aggregates.push({
    $lookup: {
      from: 'municipalities',
      localField: 'municipality',
      foreignField: '_id',
      as: 'municipality'
    }
  }, {
    $unwind: '$municipality'
  }, {
    $match: matchMunic
  }, {
    $addFields: {
      municipality_id: { $convert: { input: '$municipality._id', to: 'string' } },
      municipality_name: '$municipality.name'
    }
  });

  // Match project
  // let matchProject = {
  //   $and: [
  //     { 'project.deleted': { $eq: false } }
  //   ]
  // };
  // relation to project
  aggregates.push({
    $lookup: {
      from: 'projects',
      localField: 'project',
      foreignField: '_id',
      as: 'project'
    }
  }, {
    $unwind: '$project'
  }, {
    $addFields: {
      project_id: { $convert: { input: '$project._id', to: 'string' } },
      project_name: '$project.name'
    }
  });

  // Match event
  // let matchEvent = {
  //   $and: [
  //     { 'event.deleted': { $eq: false } }
  //   ]
  // };
  // relation to event
  aggregates.push({
    $lookup: {
      from: 'events',
      localField: 'event',
      foreignField: '_id',
      as: 'event'
    }
  }, {
    $unwind: '$event'
  }, {
    $addFields: {
      method: '$event.method',
      zipcode: '$event.zipcode',
      address: '$event.address',
      event_name: '$event.event_name',
      magazine: '$event.magazine'
    }
  });

  // Match company
  let matchCompany = {
    $and: [
      // { 'company.deleted': { $eq: false } },
      {
        $or: [
          { 'company.is_testing': null },
          { 'company.is_testing': false }
        ]
      }
    ]
  };
  // relation to project
  aggregates.push({
    $lookup: {
      from: 'companies',
      localField: 'company',
      foreignField: '_id',
      as: 'company'
    }
  }, {
    $unwind: '$company'
  }, {
    $match: matchCompany
  }, {
    $addFields: {
      company_name: '$company.name',
      company_kind: '$company.kind'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'participants',
      let: { comproject_id: '$_id' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$comproject', '$$comproject_id'] },
              { $eq: ['$deleted', false] }
            ]
          }
        }
      }, {
        $group: {
          _id: {},
          numberOfParticipants: { $sum: 1 }
        }
      }],
      as: 'participantsGrouped'
    }
  }, {
    $unwind: {
      path: '$participantsGrouped',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      number_of_participants: { $cond: ['$participantsGrouped', '$participantsGrouped.numberOfParticipants', 0] }
    }
  });

  let second_and_arr = [];
  if (condition.keyword && condition.keyword !== '') {
    second_and_arr.push({ number: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
    second_and_arr.push({ project_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });

    switch (role) {
      case constants.ROLE.SUB_ADMIN:
      case constants.ROLE.ADMIN:
        second_and_arr.push({ municipality_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
        second_and_arr.push({ company_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
        break;
      case constants.ROLE.COMPANY:
        second_and_arr.push({ municipality_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
        break;
      case constants.ROLE.MUNIC_ADMIN:
      case constants.ROLE.MUNIC_MEMBER:
        second_and_arr.push({ company_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
        break;
      default:
        break;
    }
  }

  if (condition.magazine && condition.magazine !== '') {
    second_and_arr.push({ magazine: { $eq: Number(condition.magazine) } });
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
      company: 0,
      event: 0,
      municipality: 0,
      participantsGrouped: 0
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

/** ====== PRIVATE ========= */
function getQueryAggregateParicipant(condition, comprojectId) {

  let and_arr = [{ comproject: new mongoose.Types.ObjectId(comprojectId), deleted: false }];

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  // Match user
  let matchUser = {
    $and: [
      { 'user.deleted': { $eq: false } }
    ]
  };

  aggregates.push({
    $lookup: {
      from: 'users',
      localField: 'user',
      foreignField: '_id',
      as: 'user'
    }
  }, {
    $unwind: '$user'
  }, {
    $match: matchUser
  });

  aggregates.push({
    $lookup: {
      from: 'subsidiaries',
      localField: 'user.subsidiary',
      foreignField: '_id',
      as: 'user.subsidiary'
    }
  }, {
    $unwind: '$user.subsidiary'
  }, {
    $addFields: {
      user_id: { $convert: { input: '$user._id', to: 'string' } },
      user_email: '$user.email',
      user_name: '$user.name',
      user_gender: '$user.gender',
      last_name: '$user.last_name',
      first_name: '$user.first_name',
      user_number: '$user.number',
      department: '$user.department',
      note: '$user.note',
      subsidiary_name: '$user.subsidiary.name',
      subsidiary_kind: '$user.subsidiary.kind',
      subsidiary_number: '$user.subsidiary.number'
    }
  });

  let second_and_arr = [];
  if (condition.keyword && condition.keyword !== '') {
    second_and_arr.push({ user_email: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
    second_and_arr.push({ user_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
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
      user: 0
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


function parseDonationAmount(amount) {
  amount = Math.floor(amount);
  return (amount) + help.getMsLoc(lang, 'common.label.unit.money');
}
