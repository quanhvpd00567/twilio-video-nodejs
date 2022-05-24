'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Comproject = mongoose.model('Comproject'),
  Participant = mongoose.model('Participant'),
  SubsidiaryRank = mongoose.model('SubsidiaryRank'),
  DepartmentRank = mongoose.model('DepartmentRank'),
  Subsidiary = mongoose.model('Subsidiary'),
  translate = require(path.resolve('./config/locales/mobile/ja.json')),
  help = require(path.resolve('./mobiles/controllers/help.mobile.controller')),
  simulationServerController = require(path.resolve('./modules/core/server/controllers/simulation.server.controller')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller'));

exports.pagingRankOfEmployees = async function (req, res) {
  try {
    const { page } = req.body;
    const comprojectId = await help.getComprojectJoiningId(req.user);
    const companyId = req.user.company;
    if (!comprojectId) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'system.server.error.permission') });
    }

    const comproject = await Comproject.findById(comprojectId).select('event').lean();
    if (!comproject) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'system.server.error.permission') });
    }
    let query = { deleted: false, event: comproject.event, rank: { $ne: null } };
    const limit = 50;
    const options = {
      sort: 'rank', page: page || 1, limit: limit, lean: true,
      select: 'user steps rank',
      populate: {
        path: 'user',
        select: 'name nickname subsidiary',
        populate: {
          path: 'subsidiary'
        }
      }
    };
    let [result, numberOfSubsidiaries] = await Promise.all([
      Participant.paginate(query, options),
      Subsidiary.countDocuments({ deleted: false, company: companyId, isHQ: false })
    ]);
    result = JSON.parse(JSON.stringify(result));
    result.docs = result.docs.map(item => {
      item.isHasSubsidiaries = numberOfSubsidiaries > 0;
      if (item.user && item.user.subsidiary) {
        item.user.subsidiary.name = help.parseCompanyName(item.user.subsidiary.kind, item.user.subsidiary.name);
      }
      item.steps = simulationServerController.roundSteps(item.steps);

      return item;
    });
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.pagingRankOfEmployeesGrowthRate = async function (req, res) {
  try {
    const { page } = req.body;
    const comprojectId = await help.getComprojectJoiningId(req.user);
    const companyId = req.user.company;
    if (!comprojectId) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'system.server.error.permission') });
    }

    const comproject = await Comproject.findById(comprojectId).select('event').lean();
    if (!comproject) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'system.server.error.permission') });
    }
    let query = { deleted: false, event: comproject.event, rank_growth_rate: { $ne: null } };
    const limit = 50;
    const options = {
      sort: 'rank_growth_rate', page: page || 1, limit: limit, lean: true,
      select: 'user steps rank_growth_rate growth_rate_percent',
      populate: {
        path: 'user',
        select: 'name nickname subsidiary',
        populate: {
          path: 'subsidiary'
        }
      }
    };
    let [result, numberOfSubsidiaries] = await Promise.all([
      Participant.paginate(query, options),
      Subsidiary.countDocuments({ deleted: false, company: companyId, isHQ: false })
    ]);
    result = JSON.parse(JSON.stringify(result));
    result.docs = result.docs.map(item => {
      item.isHasSubsidiaries = numberOfSubsidiaries > 0;
      if (item.user && item.user.subsidiary) {
        item.user.subsidiary.name = help.parseCompanyName(item.user.subsidiary.kind, item.user.subsidiary.name);
      }
      item.steps = simulationServerController.roundSteps(item.steps);

      return item;
    });
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.pagingRankOfSubsidiaries = async function (req, res) {
  try {
    const { page } = req.body;
    const comprojectId = await help.getComprojectJoiningId(req.user);
    if (!comprojectId) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'system.server.error.permission') });
    }
    const comproject = await Comproject.findById(comprojectId).select('event').lean();
    if (!comproject) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'system.server.error.permission') });
    }

    let query = { deleted: false, event: comproject.event };
    const limit = help.getLimit(req.body);
    const options = {
      sort: 'rank', page: page || 1, limit: limit, lean: true,
      select: 'subsidiary average_steps rank total_steps',
      populate: {
        path: 'subsidiary'
      }
    };
    let result = await SubsidiaryRank.paginate(query, options);
    if (result) {
      result.docs = result.docs.map(item => {
        if (item && item.subsidiary) {
          item.subsidiary.name = help.parseCompanyName(item.subsidiary.kind, item.subsidiary.name);
        }

        item.average_steps = simulationServerController.roundSteps(item.average_steps);
        if (item.total_steps) {
          item.total_steps = simulationServerController.roundSteps(item.total_steps);
        }
        return item;
      });
    }
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};

exports.pagingRankOfDepartments = async function (req, res) {
  try {
    const { page } = req.body;
    const comprojectId = await help.getComprojectJoiningId(req.user);
    const subsidiaryId = req.user.subsidiary;
    if (!comprojectId || !subsidiaryId) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'system.server.error.permission') });
    }
    const comproject = await Comproject.findById(comprojectId).select('event').lean();
    if (!comproject) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'system.server.error.permission') });
    }

    let query = { deleted: false, event: comproject.event, subsidiary: subsidiaryId };
    const limit = help.getLimit(req.body);
    const options = {
      sort: 'rank', page: page || 1, limit: limit, lean: true,
      populate: {
        path: 'department'
      }
    };
    let result = await DepartmentRank.paginate(query, options);
    if (result) {
      result.docs = result.docs.map(item => {
        item.average_steps = simulationServerController.roundSteps(item.average_steps);
        if (item.total_steps) {
          item.total_steps = simulationServerController.roundSteps(item.total_steps);
        }
        return item;
      });
    }
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};
