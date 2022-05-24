'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  FeatureAuthorized = mongoose.model('FeatureAuthorized'),
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

exports.get = async function (req, res) {
  try {
    let condition = req.query;
    const page = condition.page || 1;
    const limit = help.getLimit(condition);
    const options = { page: page, limit: limit };
    const aggregates = getQueryAggregate(condition);

    let result = await FeatureAuthorized.aggregatePaginate(FeatureAuthorized.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.checkPermistion = async function (req, res) {
  try {
    console.log(req.body.municipalityId);
    // req.body.municipalityId = '61eab7ec3a5e0fa211b18180';
    if (req.body.municipalityId) {
      await FeatureAuthorized.findOne({ municipality: new mongoose.Types.ObjectId(req.body.municipalityId) })
        .exec()
        .then(function (result) {
          if (result === null) {
            return res.json({ perrmision_error: true });
          }
          return res.json(result);
        });
    }

    if (req.body.companyId) {
      await FeatureAuthorized.findOne({ company: new mongoose.Types.ObjectId(req.body.companyId) })
        .exec()
        .then(function (result) {
          if (result === null) {
            return res.json({ perrmision_error: true });
          }
          return res.json(result);
        });
    }

    // return res.json(req.user);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};


function getQueryAggregate(condition) {
  let and_arr = [{ deleted: false, features_authorized: { $exists: true, $not: { $size: 0 } } }];
  if (condition.type && condition.type !== '') {
    and_arr.push({ type: condition.type });
  }

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'companies',
      let: { company_id: '$company' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$deleted', false] },
              { $eq: ['$_id', '$$company_id'] }
            ]
          }
        }
      }],
      as: 'company'
    }
  }, {
    $unwind: {
      path: '$company',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      company_id: { $convert: { input: '$company._id', to: 'string' } },
      company_name: '$company.name',
      company_kind: '$company.kind'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'municipalities',
      let: { municipality_id: '$municipality' },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$deleted', false] },
              { $eq: ['$_id', '$$municipality_id'] }
            ]
          }
        }
      }],
      as: 'municipality'
    }
  }, {
    $unwind: {
      path: '$municipality',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      munic_id: { $convert: { input: '$municipality._id', to: 'string' } },
      munic_name: '$municipality.name'
    }
  });

  let second_and_arr = [];
  if (condition.keyword && condition.keyword !== '') {
    second_and_arr.push({ company_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
    second_and_arr.push({ munic_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
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
      company: 0
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
