'use strict';
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Device = mongoose.model('Device'),
  Config = mongoose.model('Config'),
  Event = mongoose.model('Event'),
  Participant = mongoose.model('Participant'),
  Department = mongoose.model('Department'),
  path = require('path'),
  moment = require('moment-timezone'),
  master_data = require(path.resolve('./config/lib/master-data')).masterdata,
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  locale = require(path.resolve('./config/lib/locale'));

moment.tz.setDefault('Asia/Tokyo');
moment.locale('ja');

module.exports = {
  getSort: function (condition) {
    var sort = (condition.sort_direction === '-') ? condition.sort_direction : '';
    return sort + condition.sort_column;
  },

  getLimit: function (condition) {
    return condition.limit ? parseInt(condition.limit, 10) : 10;
  },

  getMessage: function (errors) {
    if (errors && errors.length > 0) {
      return { message: errors[0].msg };
    }
    return null;
  },
  // get message local
  getMsLoc: function (lang, key) {
    return locale.getMobileText(lang, key);
  },

  generateUniqueCharacters: async function (type, length = 6) {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let string = '';
    let isExisting = false;

    do {
      string = '';
      isExisting = false;

      for (var i = 0; i < length; i++) {
        string += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      if (type === 'user') {
        const user = await User.findOne({ id: string, deleted: false }).select('_id').lean();
        isExisting = !!user;
      } else if (type === 'device') {
        const device = await Device.findOne({ code: string }).select('_id').lean();
        isExisting = !!device;
      } else if (type === 'department') {
        const department = await Department.findOne({ code: string }).select('_id').lean();
        isExisting = !!department;
      }

    } while (isExisting);

    return string;
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

  getAgeFromBirthday(birthday) {
    if (!birthday) {
      return null;
    }

    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    let m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  },

  getYYYYMMDDString: function (date) {
    const dateMoment = moment(date);
    const padding = (target) => ('00' + target).slice(-2);
    return `${dateMoment.year()}/${padding(dateMoment.month() + 1)}/${padding(dateMoment.date())}`;
  },

  parseCompanyName: function (kind, name) {
    if (!kind || !name) {
      return '';
    }

    switch (kind) {
      case master_data.COMPANY_KIND.PREVIOUS_STOCK:
        return master_data.company_name_affix + name;
      case master_data.COMPANY_KIND.BACK_STOCK:
        return name + master_data.company_name_affix;
      default:
        return name;
    }
  },

  getDaysBetweenTwoDate(date1, date2) {
    if (!date1 || !date2) {
      return 0;
    }

    return Math.ceil(Math.abs(moment(date2).valueOf() - moment(date1).valueOf()) / constants.DAY_IN_MILLISECONDS);
  },

  async getComprojectJoiningId(user) {
    if (!user) {
      return null;
    }
    if (user.comproject_joining) {
      return user.comproject_joining;
    }

    const configObject = await Config.findOne({});
    if (configObject.days_show_finished_event) {
      const [eventOpeningOrPreparing, latestEventFinished, latestParticipant] = await Promise.all([
        Event.findOne({
          deleted: false, status: { $in: [constants.EVENT_STATUS.OPENING, constants.EVENT_STATUS.PREPARING] },
          company: user.company
        }).select('_id').lean(),
        Event.findOne({
          deleted: false, status: constants.EVENT_STATUS.FINISHED,
          company: user.company
        }).select('_id').sort('-end').lean(),
        Participant.findOne({ user: user._id, deleted: false }).sort('-created')
          .populate({ path: 'comproject', select: 'end' })
          .lean()
      ]);
      if (!eventOpeningOrPreparing && latestParticipant) {
        if (latestEventFinished._id.toString() === latestParticipant.event.toString()) {
          const daysFromEndOfEvent = this.getDaysBetweenTwoDate(latestParticipant.comproject.end, moment());
          if (configObject.days_show_finished_event >= daysFromEndOfEvent) {
            return latestParticipant.comproject._id;
          }
        }
      }
    }

    return null;
  }
};
