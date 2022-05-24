'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  Company = mongoose.model('Company'),
  Subsidiary = mongoose.model('Subsidiary'),
  User = mongoose.model('User'),
  Comproject = mongoose.model('Comproject'),
  SubsidiaryRank = mongoose.model('SubsidiaryRank'),
  Event = mongoose.model('Event'),
  path = require('path'),
  _ = require('lodash'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  rankServerController = require(path.resolve('./modules/core/server/controllers/rank.server.controller'));

const lang = 'ja';

exports.create = async function (req, res) {
  try {
    let data = req.body;
    const auth = req.user;
    if (!data) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    // Prepare data employee
    const dataSave = {
      kind: data.kind,
      company: auth.company,
      number: data.number,
      name: data.name
    };

    if (auth.roles[0] === constants.ROLE.ADMIN || auth.roles[0] === constants.ROLE.SUB_ADMIN) {
      dataSave.company = data.companyId;
    }

    // Check number exists;
    const [isExistSubsidiary, numberOfSubsidiaries] = await Promise.all([
      Subsidiary.findOne({ number: dataSave.number, deleted: false }).lean(),
      Subsidiary.countDocuments({ company: auth.company, isHQ: false })
    ]);
    if (isExistSubsidiary) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'subsidiaries.form.number.error.exists') });
    }

    let subsidiary = new Subsidiary(dataSave);
    subsidiary = await subsidiary.save();

    // 06/04/2022: after first subsidiary registered, set company.ranking_to_show =subsidiary_ranking
    if (numberOfSubsidiaries === 0) {
      await Company.updateOne({ _id: auth.company }, { ranking_to_show: constants.COMPANY_SETTING_RANKING.SUBSIDIARY_RANKING });
    }

    try {
      const comprojectsOpening = await Comproject.find({ deleted: false, status: constants.EVENT_STATUS.OPENING, company: auth.company }).select('_id').lean();
      if (comprojectsOpening && comprojectsOpening.length > 0) {
        for (const comprojectOpening of comprojectsOpening) {
          rankServerController.recalculateRanksForComproject(comprojectOpening._id, auth.company);
        }
      }
    } catch (error) {
      logger.error(error);
    }

    return res.json(subsidiary);
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

    var query = getQuery(condition, auth);
    if (condition.is_paging && condition.is_paging === 'true') {
      var page = condition.page || 1;
      var limit = help.getLimit(condition);

      var sort = help.getSort(condition);

      var options = { page: page, limit: limit };

      const aggregates = getUsersOfSubsidiaries(condition, auth);
      let result = await Subsidiary.aggregatePaginate(Subsidiary.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
      result = help.parseAggregateQueryResult(result, page);

      return res.json(result);

    } else {
      let result = await Subsidiary.find(query).select('name isHQ kind');

      // result = _.map(result, (item) => {
      //   if (item.isHQ === true) {
      //     item.name = help.getMsLoc(lang, 'companies.detail.name.default.label');
      //   }

      //   return item;
      // });

      return res.json(result);
    }

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getByCompany = function (req, res) {
  try {
    let company = req.user.company;
    // if ()
    Subsidiary.find({ deleted: false, company: company })
      .then((result) => {
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
    let subsidiary = req.model;
    let data = req.body;

    // Prepare data subsidiary
    const dataUpdate = {
      kind: data.kind,
      number: data.number,
      name: data.name,
      company: auth.company
    };

    if (auth.roles[0] === constants.ROLE.ADMIN || auth.roles[0] === constants.ROLE.SUB_ADMIN) {
      dataUpdate.company = data.companyId;
    }

    // Check subsidiary exists;
    const isExistSubsidiary = await Subsidiary.findOne({ number: dataUpdate.number, deleted: false, _id: { $ne: subsidiary._id } }).lean();
    if (isExistSubsidiary) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'subsidiaries.form.number.error.exists') });
    }

    subsidiary = _.extend(subsidiary, dataUpdate);
    await subsidiary.save();

    return res.json(subsidiary);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  try {
    const subsidiary = req.model;
    const auth = req.user;

    const users = await User.findOne({ subsidiary: subsidiary._id, deleted: false, company: auth.company });
    if (users) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'subsidiaries.list.controller.message.cannot_delete') });
    }

    await Subsidiary.updateOne({ _id: subsidiary._id }, { deleted: true });

    // Delete SubsidiaryRank records of OPENING comproject of subsidiary
    const eventOpening = await Event.findOne({ deleted: false, status: constants.EVENT_STATUS.OPENING, company: auth.company }).select('_id').lean();
    const eventId = eventOpening && eventOpening._id;
    if (eventId) {
      await SubsidiaryRank.updateMany({ deleted: false, subsidiary: subsidiary._id, event: eventId }, { deleted: true });
    }

    return res.json(true);

  } catch (error) {
    logger.error(error);
    // abortTransaction();
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

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

exports.subsidiaryById = function (req, res, next, id) {
  const auth = req.user;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  var company = auth.company || req.query && req.query.companyId;
  Subsidiary.findOne({ _id: id, deleted: false, company: company })
    .exec(function (err, event) {
      if (err) {
        logger.error(err);
        return res.status(400).send({
          message: 'お知らせが見つかりません。'
        });
      } else if (!event) {
        return res.status(400).send({
          message: 'お知らせが見つかりません。'
        });
      }

      req.model = event;
      next();
    });
};

/** ====== PRIVATE ========= */
function getQuery(condition, auth) {
  var company = (auth && auth.company) || condition.companyId;
  var and_arr = [{ deleted: false, company: company }];
  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { number: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.kind && condition.kind !== '') {
    and_arr.push({ kind: condition.kind });
  }

  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }

  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  return { $and: and_arr };
}

function getUsersOfSubsidiaries(condition, auth) {
  var companyId = auth.company || condition.companyId;
  let and_arr = [{ deleted: false, company: new ObjectId(companyId), isHQ: { $ne: true } }];

  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { number: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.kind && condition.kind !== '') {
    and_arr.push({ kind: Number(condition.kind) });
  }

  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }

  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'users',
      let: { subsidiary_id: '$_id', company_id: new ObjectId(companyId) },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$deleted', false] },
              { $eq: ['$subsidiary', '$$subsidiary_id'] },
              { $eq: ['$company', '$$company_id'] },
              { $in: [constants.ROLE.EMPLOYEE, '$roles'] }
            ]
          }
        }
      }, {
        $group: {
          _id: '$subsidiary',
          user_ids: { $push: { $toString: '$_id' } }
        }
      }],
      as: 'users'
    }
  }, {
    $unwind: {
      path: '$users',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      totalSteps: 0
    }
  }, {
    $project: {
      _id: 1,
      totalSteps: 1,
      name: 1,
      number: 1,
      kind: 1,
      isHQ: 1,
      created: 1,
      user_ids: '$users.user_ids'
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
