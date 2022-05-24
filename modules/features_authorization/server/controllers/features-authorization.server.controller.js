'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  FeatureAuthorized = mongoose.model('FeatureAuthorized'),
  RequestItem = mongoose.model('RequestItem'),
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

exports.get = async function (req, res) {
  try {
    const roles = req.user.roles;
    let result = null;

    if (roles.indexOf(constants.ROLE.COMPANY) !== -1) {
      result = await FeatureAuthorized.findOne({ company: req.user.company, deleted: false });
    } else if (roles.indexOf(constants.ROLE.MUNIC_ADMIN) !== -1 || roles.indexOf(constants.ROLE.MUNIC_MEMBER) !== -1) {
      result = await FeatureAuthorized.findOne({ municipality: req.user.municipality, deleted: false });
    }

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.update = async function (req, res) {
  try {
    const roles = req.user.roles;
    let body = req.body;
    if (!body) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    if (roles.indexOf(constants.ROLE.COMPANY) !== -1) {
      let featureAuthorized = await FeatureAuthorized.findOne({ type: constants.FEATURE_AUTHORIZED_TYPE.COMPANY, company: req.user.company, deleted: false });
      if (featureAuthorized) {
        featureAuthorized.features_authorized = body.features_authorized;
        await featureAuthorized.save();
      } else {
        body.type = constants.FEATURE_AUTHORIZED_TYPE.COMPANY;
        body.company = req.user.company;
        body.updated = new Date();
        await FeatureAuthorized.create(body);
      }
    } else if (roles.indexOf(constants.ROLE.MUNIC_ADMIN) !== -1 || roles.indexOf(constants.ROLE.MUNIC_MEMBER) !== -1) {
      let featureAuthorized = await FeatureAuthorized.findOne({ type: constants.FEATURE_AUTHORIZED_TYPE.MUNICIPALITY, municipality: req.user.municipality, deleted: false });
      if (featureAuthorized) {
        // check uncheck need authorization and request items existing
        let featuresNeedAuthorizedUnchecked = JSON.parse(JSON.stringify(featureAuthorized.features_authorized)).filter(item => {
          const feature = body.features_authorized.find(e => e.feature === item.feature);
          return item.is_need_authorize && (!feature || !feature.is_need_authorize);
        });
        const getRequestItemPromises = featuresNeedAuthorizedUnchecked.map(item => {
          return RequestItem.findOne({
            deleted: false, type: item.feature,
            status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] },
            municipality: featureAuthorized.municipality
          }).select('_id').lean();
        });
        const requestItems = await Promise.all(getRequestItemPromises);
        featuresNeedAuthorizedUnchecked = featuresNeedAuthorizedUnchecked.filter((item, index) => {
          return requestItems[index];
        });

        if (featuresNeedAuthorizedUnchecked.length > 0) {
          return res.status(422).send({ featuresErrorExisting: featuresNeedAuthorizedUnchecked.map(item => item.feature) });
        }

        featureAuthorized.features_authorized = body.features_authorized;
        await featureAuthorized.save();
      } else {
        body.type = constants.FEATURE_AUTHORIZED_TYPE.MUNICIPALITY;
        body.municipality = req.user.municipality;
        body.updated = new Date();
        await FeatureAuthorized.create(body);
      }
    }

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};
