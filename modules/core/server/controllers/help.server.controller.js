'use strict';
var path = require('path'),
  mongoose = require('mongoose'),
  moment = require('moment-timezone'),
  locale = require(path.resolve('./config/lib/locale')),
  User = mongoose.model('User'),
  Company = mongoose.model('Company'),
  Municipality = mongoose.model('Municipality'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  master_data = require(path.resolve('./config/lib/master-data'));

module.exports = {
  getSort: function (condition) {
    var sort = (condition.sort_direction === '-') ? condition.sort_direction : '';
    return sort + condition.sort_column;
  },

  getSortAggregate: function (condition) {
    if (condition.sort_column && condition.sort_direction) {
      var $sort = {};
      $sort[condition.sort_column] = condition.sort_direction === '-' ? -1 : 1;
      return $sort;
    }

    return '';
  },

  getLimit: function (condition) {
    return parseInt(condition.limit, 10);
  },

  getMessage: function (errors) {
    if (errors && errors.length > 0) {
      return { message: errors[0].msg };
    }
    return null;
  },
  // get message local
  getMsLoc: function (lang, key) {
    return locale.getClientText(lang, key);
  },
  getServerMsLoc: function (lang, key) {
    return locale.getServerText(lang, key);
  },

  getMasterDataValue: function (key, id) {
    const items = master_data.masterdata[key];
    if (!items || items.length === 0) {
      return id;
    }

    const element = items.find(item => item.id === id);
    return element && element.value || id;
  },

  parseAggregateQueryResult: function (result, page) {
    if (!result) {
      return {};
    }

    result.page = page;
    result.docs = result.data;

    delete result.data;
    result.totalPages = result.pageCount;
    delete result.pageCount;
    result.totalDocs = result.totalCount;
    delete result.totalCount;

    return result;
  },

  getRandomCode: async function (length, key) {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let string = '';
    let isExisting = false;

    do {
      string = '';
      isExisting = false;
      for (var i = 0; i < length; i++) {
        string += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      if (key === 'user') {
        const user = await User.findOne({ id: string, deleted: false }).select('_id').lean();
        isExisting = !!user;
      } else if (key === 'company') {
        const company = await Company.findOne({ code: string, deleted: false }).select('_id').lean();
        isExisting = !!company;
      }

      if (key === 'munic') {
        const munic = await Municipality.findOne({ code: string, deleted: false }).select('_id').lean();
        isExisting = !!munic;
      }
    } while (isExisting);

    return string;
  },

  trimAndLowercase: function (data) {
    if (!data) {
      return '';
    }

    data = data.trim();
    data = data && data.toLowerCase();

    return data;
  },

  generateUniqueStringFromNumber: function (number) {
    if (!number) {
      number = 1;
    }

    number = '' + number;
    const length = number.length;
    if (length >= 6) {
      return number;
    } else {
      const padding = (target) => ('000000' + target).slice(-6);
      return padding(number);
    }
  },

  round2Decimal: function (value) {
    if (!value) {
      return 0;
    }

    return Math.round(value * 100) / 100;
  },

  floor1Decimal: function (value) {
    if (!value) {
      return 0;
    }

    return Math.floor(value * 10) / 10;
  },

  generateStartAndEndOfEconomicYear: function (year) {
    if (!year) {
      year = moment().year();
    }

    const start = moment().set({ year: year, month: 3 }).startOf('month');
    const end = moment().set({ year: year + 1, month: 2 }).endOf('month');
    return { start, end };
  },

  generateStartAndEndOfMonthOfEconomicYear: function (year, month) {
    if (!year) {
      year = moment().year();
    }
    if (!month) {
      month = moment().month() + 1;
    }

    // month: 0 - 11
    if ([0, 1, 2].indexOf(month) !== -1) {
      month -= 1;
      const start = moment().set({ year: year + 1, month: month }).startOf('month');
      const end = moment().set({ year: year + 1, month: month }).endOf('month');
      return { start, end };
    }

    month -= 1;
    const start = moment().set({ year: year, month: month }).startOf('month');
    const end = moment().set({ year: year, month: month }).endOf('month');
    return { start, end };
  },

  generateYearMonthOfPaymentHistory: function () {
    const today = moment();
    const padding = (target) => ('00' + target).slice(-2);
    return `${today.year()}/${padding(today.month() + 1)}`;
  },

  formatNumber: function (number) {
    if (!number) {
      return 0;
    }

    return new Intl.NumberFormat().format(number);
  },

  isAdminOrSubAdmin: function (roles) {
    if (!roles || roles.length === 0) {
      return false;
    }

    return roles.indexOf(constants.ROLE.ADMIN) !== -1 || roles.indexOf(constants.ROLE.SUB_ADMIN) !== -1;
  },

  isMunicAdminOrMunicMember: function (roles) {
    if (!roles || roles.length === 0) {
      return false;
    }

    return roles.indexOf(constants.ROLE.MUNIC_ADMIN) !== -1 || roles.indexOf(constants.ROLE.MUNIC_MEMBER) !== -1;
  },

  isEventStartedOver7Days(start) {
    const days = this.getDaysBetweenTwoDate(start, moment());
    return days > 7;
  },

  getDaysBetweenTwoDate(date1, date2) {
    if (!date1 || !date2) {
      return 0;
    }

    return Math.ceil(Math.abs(moment(date2).valueOf() - moment(date1).valueOf()) / constants.DAY_IN_MILLISECONDS);
  }
};
