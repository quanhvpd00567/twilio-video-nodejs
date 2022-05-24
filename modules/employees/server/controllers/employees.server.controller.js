'use strict';

const { reject } = require('bluebird');
const { find } = require('lodash');
var qr = require('qrcode');

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Company = mongoose.model('Company'),
  Department = mongoose.model('Department'),
  User = mongoose.model('User'),
  Device = mongoose.model('Device'),
  Participant = mongoose.model('Participant'),
  Point = mongoose.model('Point'),
  PointLog = mongoose.model('PointLog'),
  Daily = mongoose.model('Daily'),
  moment = require('moment'),
  Subsidiary = mongoose.model('Subsidiary'),
  path = require('path'),
  Excel = require('exceljs'),
  _ = require('lodash'),
  fs = require('fs'),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  mailerServerUtil = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  filesServerController = require(path.resolve('./modules/core/server/controllers/files.server.controller')),
  rankServerController = require(path.resolve('./modules/core/server/controllers/rank.server.controller'));

const lang = 'ja';
var EXCEL_VALUE_TYPES = {
  Null: 0, Merge: 1, Number: 2, String: 3, Date: 4, Hyperlink: 5,
  Formula: 6, SharedString: 7, RichText: 8, Boolean: 9, Error: 10
};

exports.create = async function (req, res) {
  try {
    let data = req.body;
    const auth = req.user;
    if (!data) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    const pass = data.email.split('@')[0];
    let company = auth.company;
    if (auth.roles[0] === constants.ROLE.ADMIN || auth.roles[0] === constants.ROLE.SUB_ADMIN) {
      company = data.companyId;
    }

    let roles = [constants.ROLE.EMPLOYEE];
    if (data.role === constants.ROLE.COMPANY) {
      roles = [constants.ROLE.COMPANY, constants.ROLE.EMPLOYEE];
    }

    // Prepare data employee
    const dataEmployee = {
      last_name: data.last_name,
      first_name: data.first_name,
      name: data.last_name + ' ' + data.first_name,
      email: data.email,
      password: pass,
      number: data.number,
      subsidiary: data.subsidiary,
      e_department: data.e_department,
      company: company,
      note: data.note,
      roles: roles,
      is_required_update_password: true
    };

    const email_lower = trimAndLowercase(data.email);
    // Check email is email company
    if (auth.email === email_lower) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }

    // Check email exists;
    const user = await User.findOne({ email_lower, deleted: false }).lean();

    if (user) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }

    // Check employee no is unique
    const isExistNumber = await User.findOne({ number: data.number, company: company, deleted: false }).lean();
    if (isExistNumber) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'employees.form.number.error.exists') });
    }

    let account = new User(dataEmployee);

    account = await account.save();

    // Send mail
    mailerServerUtil.sendMailCreateEmployee(email_lower, pass, account.first_name, account.last_name);

    return res.json({ company: 1 });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};
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
    var sort = help.getSort(condition);
    User.paginate(query, {
      sort: sort,
      page: page,
      populate: [
        {
          path: 'subsidiary',
          select: 'name isHQ kind'
        },
        {
          path: 'e_department',
          select: 'name'
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

exports.update = async function (req, res) {
  try {
    const auth = req.user;
    let account = req.model;
    let data = req.body;
    let company = auth.company;
    if (auth.roles[0] === constants.ROLE.ADMIN || auth.roles[0] === constants.ROLE.SUB_ADMIN) {
      company = data.companyId;
    }

    let roles = [constants.ROLE.EMPLOYEE];
    if (data.role === constants.ROLE.COMPANY) {
      roles = [constants.ROLE.COMPANY, constants.ROLE.EMPLOYEE];
    }

    const emailOld = account.email;
    const email_lower = trimAndLowercase(data.email);

    // Prepare data employee
    const dataEmployee = {
      last_name: data.last_name,
      first_name: data.first_name,
      name: data.last_name + ' ' + data.first_name,
      email: data.email,
      subsidiary: data.subsidiary,
      e_department: data.e_department,
      number: data.number,
      note: data.note,
      roles: roles,
      company: company,
      email_lower: email_lower
    };

    // // Check email is email company
    // if (auth.email === email_lower) {
    //   return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    // }

    // Check email exists;

    const user = await User.findOne({ email_lower, deleted: false, _id: { $ne: account._id } }).lean();
    if (user) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }

    // Check employee no is unique
    const isExistNumber = await User.findOne({ number: data.number, company: company, deleted: false, _id: { $ne: account._id } }).lean();
    if (isExistNumber) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'employees.form.number.error.exists') });
    }

    const userAdmin = await User.find({ company: company, deleted: false, roles: constants.ROLE.COMPANY });

    if (userAdmin.length === 1) {
      if (data.role === constants.ROLE.EMPLOYEE && String(userAdmin[0]._id) === String(account._id)) {
        return res.status(422).send({ message: help.getMsLoc(lang, 'companies.form.error.has_one_account_admin') });
      }
    }

    // if (data.role === constants.ROLE.EMPLOYEE && String(auth._id) !== String(account._id)) {
    //   // check role
    //   const count = await User.countDocuments({ company: auth.company, deleted: false, roles: constants.ROLE.COMPANY });

    //   if (count === 1) {
    //     return res.status(422).send({ message: help.getMsLoc(lang, 'companies.form.error.has_one_account_admin') });
    //   }
    // }

    account = _.extend(account, dataEmployee);
    await account.save();

    // Send mail
    if (emailOld !== dataEmployee.email) {
      await mailerServerUtil.sendMailUpdateEmailEmployee(account.email, account.first_name, account.last_name);
    }

    return res.json(account);
  } catch (error) {

    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  try {
    const employee = req.model;
    await deleteEmployee(employee);

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.export = async function (req, res) {
  const auth = req.user;
  var condition = req.query || {};

  const FILE_EXT = '.xlsx';
  const TEMPLATE_PATH = config.uploads.employees.excel.template;
  const OUT_FILE_PATH = config.uploads.employees.excel.export;
  const FILE_NAME = '企業参加者一覧';
  // const strtime = moment().format('YYYYMMDDHHmmss');
  const outputExcelFileName = OUT_FILE_PATH + FILE_NAME + FILE_EXT;
  const CURRENT_SHEET = '企業参加者';
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);

  if (condition.is_template === 'false') {
    var query = getQuery(condition, auth);
    var sort = help.getSort(condition);
    const employees = await User.find(query)
      .populate({
        path: 'subsidiary',
        select: 'number'
      })
      .populate({
        path: 'e_department',
        select: 'code name'
      })
      .sort(sort);

    var wsExport = workbook.getWorksheet(CURRENT_SHEET);
    var row = 2;

    employees.forEach((item, index) => {
      for (let i = 1; i <= 7; i++) {
        filesServerController.setValue(wsExport, row, i, ' ');
      }

      let text = '参加者';
      if (item.roles.length > 1) {
        text = '担当者';
      }

      // number
      filesServerController.setValue(wsExport, row, 1, item.number, 'left');
      // last_name
      filesServerController.setValue(wsExport, row, 2, item.last_name, 'left');
      // first_name
      filesServerController.setValue(wsExport, row, 3, item.first_name, 'left');
      // role
      filesServerController.setValue(wsExport, row, 4, text, 'left');
      // subsidiary
      filesServerController.setValue(wsExport, row, 5, item.subsidiary.number, 'left');
      // email
      filesServerController.setValue(wsExport, row, 6, item.email, 'left');
      // department
      filesServerController.setValue(wsExport, row, 7, item.e_department ? item.e_department.code : '', 'left');
      // note
      filesServerController.setValue(wsExport, row, 8, item.note, 'left');

      row++;
    });
  }

  await workbook.xlsx.writeFile(outputExcelFileName);

  return res.json({
    url: outputExcelFileName
  });

};

async function deleteEmployee(employee) {
  let session = null;
  try {
    // 1. Del user & device
    // 2. Del participant + recalculate rank of user.comproject.joining !== null
    // 3. Del point records
    // 4. Del point-log records
    // 5. Del daily records
    session = await mongoose.startSession();
    session.startTransaction();

    const comprojectId = employee.comproject_joining;
    if (comprojectId) {
      await Participant.updateOne({ user: employee._id, comproject: employee.comproject_joining, deleted: false }, { deleted: true }, { session });
    }

    await User.updateOne({ _id: employee._id, deleted: false }, { deleted: true, comproject_joining: null }, { session });
    await Device.deleteMany({ user: employee._id }, { session });
    await Point.updateMany({ user: employee._id, deleted: false }, { deleted: true }, { session });
    await PointLog.updateMany({ user: employee._id, deleted: false }, { deleted: true }, { session });
    await Daily.updateMany({ user: employee._id, deleted: false }, { deleted: true }, { session });

    await session.commitTransaction();
    session.endSession();

    if (comprojectId) {
      try {
        rankServerController.recalculateRanksForComproject(comprojectId, employee.company);
      } catch (error) {
        logger.error(error);
      }
    }

    return true;
  } catch (error) {
    abortTransaction();
    logger.error(error);
    throw error;
  }

  function abortTransaction() {
    if (session) {
      session.abortTransaction().then(() => {
        session.endSession();
      });
    }
  }
}

exports.getCurrentCompany = async function (req, res) {
  try {
    const auth = req.user;

    const company = await Company.findOne({ _id: auth.company, deleted: false }).lean();
    return res.json(company);

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.removeMulti = async function (req, res) {
  try {
    const ids = req.body.ids;
    // Validation ids
    let users = await User.find({ deleted: false, _id: { $in: ids } }).lean();
    users = users.filter(item => item);
    for (const user of users) {
      await deleteEmployee(user);
    }

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.isOnlyOneCompanyAccount = async function (req, res) {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.json(false);
    }

    const user = await User.findById(userId).select('roles company').lean();
    if (!user) {
      return res.json(false);
    }

    const numberOfCompanyAdmins = await User.countDocuments({ deleted: false, roles: constants.ROLE.COMPANY, company: user.company });
    return res.json(numberOfCompanyAdmins === 1);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.employeeById = function (req, res, next, id) {
  const auth = req.user;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  var company = auth.company || req.query && req.query.companyId;
  User.findOne({ _id: id, deleted: false, roles: constants.ROLE.EMPLOYEE, company: company })
    .populate({
      path: 'subsidiary',
      select: 'name isHQ kind'
    })
    .populate({
      path: 'e_department',
      select: 'name'
    })
    .exec(async function (err, user) {
      if (err) {
        logger.error(err);
        return next(err);
      } else if (!user) {
        return next(new Error('お知らせが見つかりません。'));
      }

      req.model = user;
      next();
    });
};

exports.import = async function (req, res) {
  let PATH_FILE = '';
  try {
    const auth = req.user;
    let company = auth.company;
    if (auth.roles[0] === constants.ROLE.ADMIN || auth.roles[0] === constants.ROLE.SUB_ADMIN) {
      company = req.query && req.query.companyId;
    }
    if (!auth.company) {
      auth.company = company;
    }

    const SHEET_NAME = 'スタンプ一覧';
    var workbook = new Excel.Workbook();
    const [files] = await Promise.all([
      uploadHandle(req, res)
    ]);

    PATH_FILE = files.path;
    await workbook.xlsx.readFile(PATH_FILE);
    const presentSheet = workbook.worksheets[0];
    const sheetName = presentSheet.name;
    let isHasAccountAdmin = false;
    let isHasAccountAdminImport = false;
    // if (!presentSheet) {
    //   return res.status(422).send({ message: sheetName + help.getMsLoc(lang, 'common.server.import.error.sheet.no') });
    // }

    let countEmployeeAdmin = await User.countDocuments({ company: company, deleted: false, roles: constants.ROLE.COMPANY });
    if (countEmployeeAdmin >= 1) {
      isHasAccountAdmin = true;
    }

    let presentRowData = [];
    let totalErrors = [];

    presentSheet.eachRow(function (row, rowNumber) {
      if (rowNumber > 1) {
        presentRowData.push(getPresentFromRowExcel(row, rowNumber, lang, sheetName, auth));
      }
    });

    let presents = [];

    // Check format
    presentRowData.forEach(item => {
      if (item.isValid) {
        if (item.data.roles && item.data.roles.length > 1) {
          isHasAccountAdminImport = true;
        }
        presents.push(item.data);
      } else {
        totalErrors = totalErrors.concat(item.errors);
      }
    });

    if (!isHasAccountAdminImport && !isHasAccountAdmin) {
      unlinkPathFile(PATH_FILE);
      return res.status(422).send({ message: help.getMsLoc(lang, 'companies.form.error.has_one_account_admin') });
    }

    if (totalErrors.length > 0) {
      unlinkPathFile(PATH_FILE);
      return res.jsonp({ status: false, errors: totalErrors });
    }


    // 1. validate
    presents.forEach(item => {
      const errors = validatePresentData(item, lang, sheetName);
      if (errors && errors.length > 0) {
        totalErrors = totalErrors.concat(errors);
      }
    });

    if (totalErrors.length > 0) {
      unlinkPathFile(PATH_FILE);
      return res.jsonp({ status: false, errors: totalErrors });
    }

    // 2. Check sub company
    const listSub = await Subsidiary.find({ company: new mongoose.Types.ObjectId(company), deleted: false }).select('number');

    let subNunbers = [];
    if (listSub.length > 0) {
      subNunbers = _.map(listSub, function (item) {
        return item.number;
      });
    }

    let numbers = [];

    // 2. Check department
    const listDepartment = await Department.find({ company: new mongoose.Types.ObjectId(company), deleted: false })
      .select('code subsidiary')
      .populate({ path: 'subsidiary', select: 'number' }).lean();

    let subDepartmentCode = [];
    if (listSub.length > 0) {
      subDepartmentCode = _.map(listDepartment, function (item) {
        return { departmentCode: item.code, subsidiaryNumber: item.subsidiary && item.subsidiary.number };
      });
    }

    presents.forEach(item => {
      // check number duplicated
      if (item.number && item.number !== '') {

        // get list number employee
        numbers.push(item.number);
        if (_.filter(presents, { number: item.number }).length > 1) {
          totalErrors.push(getMsgWithValue(sheetName, item.row, item.number, help.getMsLoc(lang, 'employees.form.number.error.duplicated'), lang));
        }
      }

      // check email duplicated
      if (item.email && item.email !== '') {
        if (_.filter(presents, { email: item.email }).length > 1) {
          totalErrors.push(getMsgWithValue(sheetName, item.row, item.email, help.getMsLoc(lang, 'employees.form.email.error.duplicated'), lang));
        }
      }

      // check sub company
      if (item.subsidiary && item.subsidiary !== '') {
        if (!subNunbers.includes(String(item.subsidiary))) {
          totalErrors.push(getMsgWithValue(sheetName, item.row, item.subsidiary, help.getMsLoc(lang, 'employees.form.subsidiary.error.invalid'), lang));
        }
      }

      // check department
      if (item.e_department && item.e_department !== '') {
        const departmentsOfSubsidiary = subDepartmentCode.filter(element => element.subsidiaryNumber === item.subsidiary);
        const departmentCodesOfSubsidiary = departmentsOfSubsidiary.map(element => element.departmentCode);
        if (!departmentCodesOfSubsidiary.includes(String(item.e_department))) {
          totalErrors.push(getMsgWithValue(sheetName, item.row, item.department, help.getMsLoc(lang, 'employees.form.e_department.error.invalid'), lang));
        }
      }
    });

    let employees = await User.find({ company: company, deleted: false, number: { $in: numbers } }).select('number');

    let employeesNo = [];
    if (employees.length > 0) {
      employeesNo = _.map(employees, function (item) {
        return item.number;
      });
    }

    let listEmployeeUpdate = [];
    let listEmployeeCreate = [];
    presents.forEach(item => {
      if (employeesNo.includes(String(item.number))) {
        delete item.password;
        listEmployeeUpdate.push(item);
      } else {
        listEmployeeCreate.push(item);
      }
    });

    if (totalErrors.length > 0) {
      unlinkPathFile(PATH_FILE);
      return res.jsonp({ status: false, errors: totalErrors });
    }

    if (listEmployeeUpdate.length === 0 && listEmployeeCreate.length === 0) {
      return res.json({ status: true, result: [] });
    }

    console.log(1212);

    // let isAdminUpdate = true;
    let listEmployeeUpdateEmail = [];
    let totalAdminUpdateRole = 0;
    if (listEmployeeUpdate.length > 0) {
      const errorUpdate = await checkDataEmployeeUpdate(listEmployeeUpdate, sheetName, lang, company);
      // isAdminUpdate = errorUpdate[1];
      totalErrors = totalErrors.concat(errorUpdate[0]);
      listEmployeeUpdateEmail = errorUpdate[2];
      totalAdminUpdateRole = errorUpdate[3];
    }

    if (!isHasAccountAdminImport && totalAdminUpdateRole === countEmployeeAdmin) {
      unlinkPathFile(PATH_FILE);
      return res.status(422).send({ message: help.getMsLoc(lang, 'companies.form.error.has_one_account_admin') });
    }

    const errorCreate = await checkDataEmployeeCreate(listEmployeeCreate, sheetName, lang);
    totalErrors = totalErrors.concat(errorCreate);

    if (totalErrors.length > 0) {
      // unlinkPathFile(PATH_FILE);
      return res.jsonp({ status: false, errors: totalErrors });
    }

    const promiseUpdate = listEmployeeUpdate.map(async item => {
      _.filter(listSub, function (x) {
        if (String(x.number) === String(item.subsidiary)) {
          item.subsidiary = x._id;
        }
      });

      _.filter(listDepartment, function (x) {
        if (String(x.code) === String(item.e_department) && String(x.subsidiary._id) === String(item.subsidiary)) {
          item.e_department = x._id;
        }
      });

      item.number = String(item.number);
      return await User.findOneAndUpdate(
        { number: String(item.number), company: company, deleted: false },
        item
      );
    });

    const promiseCreate = listEmployeeCreate.map(async item => {
      _.filter(listSub, function (x) {
        if (String(x.number) === String(item.subsidiary)) {
          item.subsidiary = x._id;
        }
      });

      _.filter(listDepartment, function (x) {
        if (String(x.code) === String(item.e_department) && String(x.subsidiary._id) === String(item.subsidiary)) {
          item.e_department = x._id;
        }
      });

      return await (new User(item)).save();
    });

    await Promise.all([promiseUpdate, promiseCreate]);

    await sendMailEmployeeUpdateEmail(listEmployeeUpdateEmail);
    await sendMailEmployee(listEmployeeCreate);

    // unlinkPathFile(PATH_FILE);

    return res.json({ status: true, result: [] });

  } catch (error) {
    unlinkPathFile(PATH_FILE);
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.createQrCode = async function (req, res) {
  try {

    let subsidiary = req.query.subsidiary;
    let company = req.user.company;
    let url = req.query.url;
    let hash = JSON.stringify({ company: company, subsidiary: subsidiary });
    hash = Buffer.from(hash).toString('base64');

    let path = config.uploads.employees.img.qrcode;
    let filename = `${company}_${subsidiary}.png`;

    let data = url + hash;

    await qr.toFile(path + filename,
      [{ data: data, mode: 'byte' }],
      {},
      (err) => {
        console.log(err);
      });

    return res.json({
      url: data,
      qr: path + filename
    });

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getInfoCompany = async function (req, res) {
  try {
    let infoHash = req.body.info;

    let info = Buffer.from(infoHash, 'base64').toString('ascii');
    info = JSON.parse(info);

    Company.findOne({ _id: new mongoose.Types.ObjectId(info.company), deleted: false }).lean()
      .then(company => {
        if (!company) return res.status(422).send({ message: help.getMsLoc() });
        Subsidiary.findOne({ _id: new mongoose.Types.ObjectId(info.subsidiary), deleted: false }).lean()
          .then(sub => {
            if (!sub) return res.status(422).send({ message: help.getMsLoc() });
            return res.json({
              company: company,
              subsidiary: sub
            });
          });
      });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.guestCreate = async function (req, res) {
  try {
    let data = req.body;

    // const auth = req.user;
    if (!data) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    let subsidiary = await Subsidiary.findById(data.subsidiary)
      .populate({
        path: 'company'
      })
      .lean();

    if (!subsidiary) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    data.role = [constants.ROLE.EMPLOYEE];

    // Prepare data employee
    const dataEmployee = {
      last_name: data.last_name,
      first_name: data.first_name,
      name: data.last_name + ' ' + data.first_name,
      email: data.email,
      password: data.password,
      number: data.number,
      subsidiary: data.subsidiary,
      e_department: data.e_department,
      company: subsidiary.company._id,
      note: data.note,
      roles: data.role
    };

    const email_lower = trimAndLowercase(data.email);
    // Check email exists;
    const user = await User.findOne({ email_lower, deleted: false }).lean();

    if (user) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }

    // Check employee no is unique
    const isExistNumber = await User.findOne({ number: data.number, company: subsidiary.company._id, deleted: false }).lean();
    if (isExistNumber) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'employees.form.number.error.exists') });
    }

    let account = new User(dataEmployee);

    account = await account.save();

    // Send mail
    mailerServerUtil.sendMailGuestCreateEmployee(email_lower, dataEmployee.name);

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

/** ====== PRIVATE ========= */
function getQuery(condition, auth) {
  var company = auth.company || condition.companyId;
  var and_arr = [{ deleted: false, roles: constants.ROLE.EMPLOYEE, company: company }];
  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { last_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { first_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { number: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { email: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  if (condition.subsidiary && condition.subsidiary !== '') {
    and_arr.push({ subsidiary: condition.subsidiary });
  }

  if (condition.role && condition.role !== '') {
    if (condition.role === constants.ROLE.EMPLOYEE) {
      and_arr.push({ roles: { $eq: condition.role } });
      and_arr.push({ roles: { $ne: constants.ROLE.COMPANY } });
    } else {
      and_arr.push({ roles: condition.role });
    }
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

/** process upload file */
function uploadHandle(req, res) {
  return new Promise(function (resolve, reject) {
    var upload = multer(config.uploads.employees.excel).single('import');
    upload.fileFilter = require(path.resolve('./config/lib/multer')).csvFileFilter;
    upload(req, res, function (err) {
      if (err) {
        reject(err);
      }
      if (req.file) {
        resolve(req.file);
      } else {
        reject({ message: help.getMsLoc(lang, 'common.server.error.import.failed') });
      }
    });
  });
}

function getPresentFromRowExcel(row, rowNumber, userLanguage, sheetName, auth) {
  try {
    let email = getCellValue(row, 6, rowNumber, userLanguage, sheetName);
    const last_name = getCellValue(row, 2, rowNumber, userLanguage, sheetName);
    const first_name = getCellValue(row, 3, rowNumber, userLanguage, sheetName);
    let roles = getCellValue(row, 4, rowNumber, userLanguage, sheetName);
    let userRole = '';
    if (roles && roles !== '') {
      userRole = [];
      if (roles.match(/^担当者$/) !== null) {
        userRole = [constants.ROLE.COMPANY, constants.ROLE.EMPLOYEE];
      }

      if (roles.match(/^参加者$/) !== null) {
        userRole = [constants.ROLE.EMPLOYEE];
      }
    }

    email = trimAndLowercase(email);
    return {
      isValid: true,
      data: {
        row: rowNumber, // number row
        number: getCellValue(row, 1, rowNumber, userLanguage, sheetName),
        first_name: first_name,
        last_name: last_name,
        subsidiary: getCellValue(row, 5, rowNumber, userLanguage, sheetName),
        email: email,
        e_department: getCellValue(row, 7, rowNumber, userLanguage, sheetName),
        note: getCellValue(row, 8, rowNumber, userLanguage, sheetName),
        password: email.split('@')[0],
        name: last_name + ' ' + first_name,
        company: auth.company,
        roles: userRole,
        email_lower: email
      }
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error.message]
    };
  }
}

function getCellValue(row, column, rowNumber, userLanguage, sheetName) {
  try {

    if (!row || !row.getCell(column)) {
      let message1 = '';
      if (userLanguage === 'en') {
        message1 = `at cell ${column} ${help.getMsLoc(userLanguage, 'common.server.error.import.format')}`;
      } else {
        message1 = `セルで${column}${help.getMsLoc(userLanguage, 'common.server.error.import.format')}`;
      }
      const message = getMsg(sheetName, rowNumber, message1, userLanguage);
      throw new Error(message);
    }

    switch (row.getCell(column).type) {
      case EXCEL_VALUE_TYPES.Null: {
        return null;
      }
      case EXCEL_VALUE_TYPES.Number: {
        const value = row.getCell(column) && row.getCell(column).value;
        return value;
      }
      case EXCEL_VALUE_TYPES.String: {
        const value = row.getCell(column) && row.getCell(column).value && row.getCell(column).value.trim() || '';
        return value;
      }
      case EXCEL_VALUE_TYPES.Date: {
        const value = row.getCell(column) && row.getCell(column).value || new Date();
        return value;
      }
      case EXCEL_VALUE_TYPES.Hyperlink: {
        const value = row.getCell(column) && row.getCell(column).value
          && row.getCell(column).value.text && row.getCell(column).value.text.trim() || '';
        return value;
      }
      case EXCEL_VALUE_TYPES.RichText: {
        const richTexts = row.getCell(column) && row.getCell(column).value && row.getCell(column).value.richText || [];
        const texts = richTexts.map(item => {
          return item.text && item.text || '';
        });
        return texts.join('');
      }
    }
  } catch (error) {
    let message1 = '';
    if (userLanguage === 'en') {
      message1 = `at cell ${column} ${help.getMsLoc(userLanguage, 'common.server.error.import.format')}`;
    } else {
      message1 = `セルで${column}${help.getMsLoc(userLanguage, 'common.server.error.import.format')}`;
    }
    const message = getMsg(sheetName, rowNumber, message1, userLanguage);
    throw new Error(message);
  }
}

function getMsg(sheet, row, error, userlanguage) {
  if (userlanguage === 'en') {
    return 'Sheet「' + sheet + '」in line「' + row + '」' + error;
  } else {
    return '「' + sheet + '」シートの「' + row + '」行目で' + error;
  }
}

async function checkDataEmployeeCreate(listEmployeeCreate, sheetName, lang) {
  let totalErrors = [];

  for (var i = 0; i < listEmployeeCreate.length; i++) {
    let item = listEmployeeCreate[i];
    if (!item.email) {
      totalErrors.push(getMsgWithValue(sheetName, item.row, help.getMsLoc(lang, 'employees.form.email.label'), help.getMsLoc(lang, 'employees.form.email.error.required'), lang));
      continue;
    }

    const isExistEmail = await User.findOne({ email_lower: item.email, deleted: false }).lean();
    if (isExistEmail) {
      totalErrors.push(getMsgWithValue(sheetName, item.row, item.email, help.getMsLoc(lang, 'employees.form.email.error.duplicated'), lang));
    }

    item.email_lower = item.email;
  }

  return totalErrors;
}

async function checkDataEmployeeUpdate(listEmployeeUpdate, sheetName, lang, companyId) {
  let totalErrors = [];
  let hasAdmin = false;
  let listEmployeeUpdateEmail = [];
  let totalAdminUpdateRole = 0;

  for (var i = 0; i < listEmployeeUpdate.length; i++) {
    let item = listEmployeeUpdate[i];

    const user = await User.findOne({ deleted: false, number: { $eq: String(item.number) }, company: companyId }).lean();
    const isExistsEmail = await User.findOne({ deleted: false, email_lower: item.email, number: { $ne: String(item.number) } }).lean();

    if (isExistsEmail) {
      totalErrors.push(getMsgWithValue(sheetName, item.row, item.email, help.getMsLoc(lang, 'employees.form.email.error.duplicated'), lang));
    }
    if (user.roles[0] === constants.ROLE.COMPANY && user.roles.length === item.roles.length) {
      hasAdmin = true;
    }

    if (user.roles[0] === constants.ROLE.COMPANY && item.roles.length === 1) {
      totalAdminUpdateRole++;
    }

    if (user.email !== item.email) {
      listEmployeeUpdateEmail.push(item);
    }

    delete item.password;
  }

  return [totalErrors, hasAdmin, listEmployeeUpdateEmail, totalAdminUpdateRole];
}

async function sendMailEmployee(listEmployeeCreate) {
  for (var i = 0; i < listEmployeeCreate.length; i++) {
    let item = listEmployeeCreate[i];
    // Send mail
    await mailerServerUtil.sendMailCreateEmployee(item.email, item.password, item.first_name, item.last_name);
  }
}

async function sendMailEmployeeUpdateEmail(listEmployeeUpdateEmail) {
  for (var i = 0; i < listEmployeeUpdateEmail.length; i++) {
    let item = listEmployeeUpdateEmail[i];
    // Send mail
    await mailerServerUtil.sendMailUpdateEmailEmployee(item.email, item.first_name, item.last_name);
  }
}

function validatePresentData(item, userLanguage, sheetName) {
  let errors = [];
  // Check number is null
  if (!item.number) {
    errors.push(getMsgWithValue(sheetName, item.row, help.getMsLoc(userLanguage, 'employees.form.number.label'), help.getMsLoc(userLanguage, 'employees.form.number.error.required'), userLanguage, null));
  }

  // Check first_name is null
  if (!item.first_name) {
    errors.push(getMsgWithValue(sheetName, item.row, help.getMsLoc(userLanguage, 'employees.form.first_name.label'), help.getMsLoc(userLanguage, 'employees.form.first_name.error.required'), userLanguage, null));
  }

  // Check first_name max length
  if (item.first_name && item.first_name.length > 16) {
    errors.push(getMsgWithValue(sheetName, item.row, help.getMsLoc(userLanguage, 'employees.form.first_name.label'), help.getMsLoc(userLanguage, 'employees.form.first_name.error.max_length'), userLanguage, null));
  }

  // Check last_name is null
  if (!item.last_name) {
    errors.push(getMsgWithValue(sheetName, item.row, help.getMsLoc(userLanguage, 'employees.form.last_name.label'), help.getMsLoc(userLanguage, 'employees.form.last_name.error.required'), userLanguage, null));
  }

  // Check last_name max length
  if (item.last_name && item.last_name.length > 16) {
    errors.push(getMsgWithValue(sheetName, item.row, help.getMsLoc(userLanguage, 'employees.form.last_name.label'), help.getMsLoc(userLanguage, 'employees.form.last_name.error.max_length'), userLanguage, null));
  }

  // Check subsidiary is null
  if (!item.subsidiary) {
    errors.push(getMsgWithValue(sheetName, item.row, help.getMsLoc(userLanguage, 'employees.form.subsidiary.label'), help.getMsLoc(userLanguage, 'employees.form.subsidiary.required'), userLanguage, null));
  }

  // Check role is null
  if (!item.roles) {
    errors.push(getMsgWithValue(sheetName, item.row, help.getMsLoc(userLanguage, 'employees.form.role.label'), help.getMsLoc(userLanguage, 'employees.form.role.error.required'), userLanguage, null));
  }

  // Check email is null
  if (!item.email) {
    errors.push(getMsgWithValue(sheetName, item.row, help.getMsLoc(userLanguage, 'employees.form.email.label'), help.getMsLoc(userLanguage, 'employees.form.email.error.required'), userLanguage, null));
  }

  // Check email format
  if (item.email && item.email !== '' && !validateEmail(item.email)) {
    errors.push(getMsgWithValue(sheetName, item.row, help.getMsLoc(userLanguage, 'employees.form.email.label'), help.getMsLoc(userLanguage, 'employees.form.email.error.invalid'), userLanguage, null));
  }

  if (typeof item.roles !== 'string' && item.roles.length === 0) {
    errors.push(getMsgWithValue(sheetName, item.row, help.getMsLoc(userLanguage, 'employees.form.role.label'), help.getMsLoc(userLanguage, 'employees.form.role.error.invalid'), userLanguage, null, true));
  }

  return errors;
}

function getMsgWithValue(sheet, row, value, error, userlanguage, option = null, isHidden = false) {
  if (userlanguage === 'en') {
    error = error.replace('{0}', `"${value}"`);
    if (option) {
      error = error.replace('{1}', option);
    }
    return 'Sheet「' + sheet + '」in line「' + row + '」' + `${error}`;
  } else {
    error = error.replace('{0}', `「${value}」`);
    if (option) {
      error = error.replace('{1}', option);
    }

    if (isHidden) {
      return '「' + sheet + '」シートの「' + row + '」' + `${error}`;
    }

    return '「' + sheet + '」シートの「' + row + '」行目で' + `${error}`;
  }
}

function unlinkPathFile(PATH_FILE) {
  fs.unlink(PATH_FILE, (err) => {
    if (err) {
      logger.error(err);
    }
  });
}

function validateEmail(email) {
  const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const match = email.match(pattern);

  return match !== null;
}
