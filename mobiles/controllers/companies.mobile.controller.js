'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Comproject = mongoose.model('Comproject'),
  Subsidiary = mongoose.model('Subsidiary'),
  translate = require(path.resolve('./config/locales/mobile/ja.json')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  helper = require(path.resolve('./mobiles/controllers/help.mobile.controller')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller'));

exports.list = async function (req, res) {
  try {
    const companyId = req.user.company;
    const comprojectId = await helper.getComprojectJoiningId(req.user);
    if (!comprojectId) {
      return res.json([]);
    }
    const comproject = await Comproject.findById(comprojectId).select('event').lean();
    const eventId = comproject && comproject.event;
    const comprojectsOfEvent = await Comproject.find({ deleted: false, event: eventId }).select('_id').lean();
    const comprojectIds = comprojectsOfEvent.map(item => item._id);

    const aggregateQuery = [
      {
        $match: { company: companyId, deleted: false }
      },
      {
        $lookup: {
          from: 'users',
          let: { subsidiary_id: '$_id', company_id: '$company' },
          pipeline: [{
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$subsidiary', '$$subsidiary_id'] },
                  { $eq: ['$company', '$$company_id'] },
                  { $in: [constants.ROLE.EMPLOYEE, '$roles'] },
                  { $in: ['$comproject_joining', comprojectIds] }, // Add this to count number of employee joining this comproject
                  { $eq: ['$deleted', false] }
                ]
              }
            }
          }, {
            $group: {
              _id: {},
              total: { $sum: 1 }
            }
          }],
          as: 'countEmployee'
        }
      }, {
        $unwind: {
          path: '$countEmployee',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          kind: 1,
          totalEmployees: { $cond: ['$countEmployee.total', '$countEmployee.total', 0] }
        }
      }
    ];

    let result = await Subsidiary.aggregate(aggregateQuery).allowDiskUse(true);
    result = result.map(item => {
      item.name = helper.parseCompanyName(item.kind, item.name);
      return item;
    });
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: translate['system.server.error'] });
  }
};
