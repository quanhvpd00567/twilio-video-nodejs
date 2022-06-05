'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Municipality = mongoose.model('Municipality'),
  Order = mongoose.model('Order'),
  ObjectId = mongoose.Types.ObjectId,
  path = require('path'),
  moment = require('moment-timezone'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

const lang = 'ja';
const LIMIT = 20;
/**
 * Handle get list event
 *
 * @param {*} req
 * @param {*} res
 */
exports.history = async function (req, res) {
  try {
    var query = getQueryAggregates();
    await Municipality.aggregate(query).then(function (result) {
      if (result) {
        result = result.map(function (item) {
          return {
            municId: item._id._id,
            municCode: item._id.code,
            municName: item._id.name,
            totalPrice: item.totalPrice,
            totalMonthPrice: item.totalMonthPrice
          };
        });
      }
      return res.json(result);
    });

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.historyByMunic = async function (req, res) {
  try {
    const municId = req.params.municId;
    const topProductsCount = await Order.aggregate(getQueryAggregatesTopProduct(municId, 'true', true, LIMIT));
    const topProductsPrice = await Order.aggregate(getQueryAggregatesTopProduct(municId, 'true', false, LIMIT));
    // console.log(topProductsCount);
    // console.log(topProductsPrice);
    return res.json({ topProductsCount: topProductsCount, topProductsPrice: topProductsPrice });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.filterCountByMunic = async function (req, res) {
  try {
    const municId = req.params.municId;
    const byMonth = req.params.byMonth;
    const topProductsCount = await Order.aggregate(getQueryAggregatesTopProduct(municId, byMonth, true, LIMIT));
    return res.json({ topProductsCount: topProductsCount });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.filterPriceByMunic = async function (req, res) {
  try {
    const municId = req.params.municId;
    const byMonth = req.params.byMonth;
    const topProductsPrice = await Order.aggregate(getQueryAggregatesTopProduct(municId, byMonth, false, LIMIT));
    return res.json({ topProductsPrice: topProductsPrice });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

/** ====== PRIVATE ========= */
function getQueryAggregates() {
  let aggregate_arr = [];
  aggregate_arr.push({
    $match: {
      // deleted: false,
      $or: [
        { is_testing: null },
        { is_testing: false }
      ]
    }
  });
  const thisMonth = moment().month();

  aggregate_arr.push({
    $lookup: {
      from: 'orders',
      let: { 'munic_id': '$_id' },
      pipeline: [
        {
          $match:
          {
            $expr:
            {
              $and:
                [
                  { $eq: ['$municipality', '$$munic_id'] }
                ]
            }
          }
        }
      ],
      as: 'order'
    }
  });
  aggregate_arr.push({
    $unwind: {
      path: '$order',
      preserveNullAndEmptyArrays: true
    }
  });
  aggregate_arr.push({
    $group: {
      '_id': { _id: '$_id', code: '$code', name: '$name' },
      totalPrice: { $sum: '$order.total' },
      totalMonthPrice: {
        $sum: {
          '$switch': {
            'branches': [
              {
                'case': { $eq: [{ $month: { date: '$order.created', timezone: 'Asia/Tokyo' } }, thisMonth + 1] },
                'then': '$order.total'
              }
            ],
            'default': 0
          }
        }
      }
    }
  });
  aggregate_arr.push({
    $project: {
      _id: 1,
      name: 1,
      code: 1,
      totalPrice: 1,
      totalMonthPrice: 1
    }
  });

  aggregate_arr.push({
    '$sort': {
      'totalMonthPrice': -1,
      '_id.code': -1
    }
  });

  return aggregate_arr;
}

// isCount: true => counter number product
// isCount: false => sum price product
function getQueryAggregatesTopProduct(municId, byMonth, isCount, limit) {
  let aggregate_arr = [];
  const match = { municipality: new ObjectId(municId) };

  if (byMonth === 'true') {
    const thisMonth = moment().month();
    match.$expr = { $eq: [{ $month: { date: '$created', timezone: 'Asia/Tokyo' } }, thisMonth + 1] };
  }

  aggregate_arr.push({
    $match: match
  });

  aggregate_arr.push({
    $unwind: {
      path: '$products'
    }
  });

  aggregate_arr.push({
    $lookup: {
      from: 'products',
      localField: 'products.product',
      foreignField: '_id',
      as: 'product'
    }
  });
  aggregate_arr.push({
    $unwind: '$product'
  });

  if (isCount) {
    aggregate_arr.push({
      $group: {
        '_id': { _id: '$products.product', name: '$product.name' },
        count: { $sum: '$products.quantity' }
      }
    });

    aggregate_arr.push({
      '$sort': {
        'count': -1
      }
    });
  } else {
    aggregate_arr.push({
      $group: {
        '_id': { _id: '$products.product', name: '$product.name' },
        sum: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
      }
    });

    aggregate_arr.push({
      '$sort': {
        'sum': -1
      }
    });
  }

  aggregate_arr.push({
    '$sort': {
      'count': -1
    }
  });

  aggregate_arr.push({
    '$limit': limit
  });

  aggregate_arr.push({
    $project: {
      'product': 1,
      count: 1,
      sum: 1
    }
  });

  return aggregate_arr;
}
