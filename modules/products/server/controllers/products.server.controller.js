'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Product = mongoose.model('Product'),
  User = mongoose.model('User'),
  Municipality = mongoose.model('Municipality'),
  Location = mongoose.model('Location'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  _ = require('lodash'),
  mailerServerUtil = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  imageController = require(path.resolve('./modules/core/server/controllers/image.server.controller')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  FEATURE_MUNICIPALITY = require(path.resolve('./config/lib/master-data')).masterdata.FEATURE_MUNICIPALITY,
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  REQUEST_ITEM_STATUSES = Object.keys(constants.REQUEST_ITEM_STATUS).map(key => constants.REQUEST_ITEM_STATUS[key]);


const lang = 'ja';

exports.create = async function (req, res) {
  try {
    var data = req.body;
    let auth = req.user;
    if (auth.roles[0] !== 'admin') {
      data.municipality = auth.municipality;
    }

    // check exists code
    let isExistsCodeInProduct = await Product.findOne({ code: data.code, municipality: auth.municipality, deleted: false }).lean();

    if (isExistsCodeInProduct) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'products.form.code.error.exists') });
    }
    let product = new Product(data);

    await product.save();
    return res.json(product);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.uploadImage = function (req, res) {
  var imgConfig = config.uploads.products.image;
  imageController.uploadImage(imgConfig, 'image', req, res)
    .then(function (imageUrl) {
      res.json(imageUrl);
    })
    .catch(function (err) {
      logger.error(err);
      return res.status(422).send({ message: 'サーバーでエラーが発生しました。' });
    });
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

    if (auth.roles[0] !== 'admin') {
      condition.municipality = auth.municipality;
    }

    var limit = help.getLimit(condition);
    var options = { page: page, limit: limit };

    const aggregates = getQueryAggregate(condition);
    let result = await Product.aggregatePaginate(Product.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
    // Product.paginate(query, {
    //   sort: sort,
    //   page: page,
    //   limit: limit,
    //   populate: [
    //     {
    //       path: 'municipality',
    //       select: 'name'
    //     },
    //     {
    //       path: 'location',
    //       select: 'name'
    //     }
    //   ],
    //   collation: { locale: 'ja' }
    // }).then(function (result) {
    //   return res.json(result);
    // });

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
    let product = req.model;
    let data = req.body;

    if (auth.roles[0] !== 'admin') {
      data.municipality = auth.municipality;
    }

    // check exists code
    let isExistsCodeInProduct = await Product.findOne({ code: data.code, municipality: data.municipality, _id: { $ne: product._id } }).lean();

    console.log(isExistsCodeInProduct);
    if (isExistsCodeInProduct) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'products.form.code.error.exists') });
    }

    product = prepareDataUpdate(product, data);
    await product.save();

    return res.json(product);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

function arrayEquals(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
}

function prepareDataUpdate(product, data) {
  product = _.extend(product, data);

  // 取扱い数量
  if (product.is_set_stock_quantity === 1) {
    product.stock_quantity = 0;
  }

  // 購入上限
  if (product.is_set_max_quantity === 1) {
    product.max_quantity = 0;
  }

  // 受付終了にする
  if (product.sell_status && product.sell_status !== 1) {
    product.sell_status = 2;
  }

  // 画面に表示しない
  if (product.show_status && product.show_status !== 1) {
    product.show_status = 2;
  }

  return product;
}

exports.delete = async function (req, res) {
  try {
    const product = req.model;
    const auth = req.user;

    await Product.updateOne({ _id: product._id, municipality: auth.municipality, deleted: false }, { deleted: true });

    return res.json(true);

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.removeMulti = async function (req, res) {
  try {
    const ids = req.body.ids;
    const auth = req.user;
    await User.updateMany({ _id: { $in: ids }, deleted: false, municipality: auth.municipality }, { deleted: true });

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.uploadPictures = async function (req, res) {
  try {
    var imgConfig = config.uploads.products.image;

    await imageController.uploadMultiImages(imgConfig, 'images', req, res)
      .then(function (imageUrl) {
        res.json(imageUrl);
      })
      .catch(function (err) {
        logger.error(err);
        return res.status(422).send({ message: 'サーバーでエラーが発生しました。' });
      });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getMunicipality = async function (req, res) {
  try {
    const municipalityId = req.query && req.query.municipalityId || req.user.municipality;
    Municipality.findOne({ _id: new mongoose.Types.ObjectId(municipalityId) }).exec()
      .then(data => res.json(data));
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getMunicipalitiesAll = async function (req, res) {
  try {
    Municipality.find({ deleted: false }).exec()
      .then(data => res.json(data));
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getLocationByMunic = async function (req, res) {
  try {
    Location.find({ deleted: false, municipality: new mongoose.Types.ObjectId(req.query.municId) }).exec()
      .then(data => res.json(data));
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.productById = function (req, res, next, id) {
  const auth = req.user;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  const query = { _id: id };

  if (auth.roles[0] !== constants.ROLE.ADMIN && auth.roles[0] !== constants.ROLE.SUB_ADMIN) {
    query.municipality = auth.municipality;
  }

  Product.findOne(query)
    .populate('location', 'name')
    .populate('municipality', 'name')
    .exec(function (err, event) {
      if (err) {
        logger.error(err);
        return next(err);
      }
      // else if (!event) {
      //   return next(new Error('お知らせが見つかりません。'));
      // }

      req.model = event;
      next();
    });
};

/** ====== PRIVATE ========= */
function getQuery(condition, auth) {
  // let municipalityId = auth.municipality;
  // if (auth.roles[0] === constants.ROLE.ADMIN || auth.roles[0] === constants.ROLE.SUB_ADMIN) {
  //   municipalityId = condition.municipalityId;
  // }
  var and_arr = [{ deleted: false }];
  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { code: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.operator && condition.operator !== '') {
    and_arr.push({ operator: { $regex: '.*' + condition.operator + '.*', $options: 'i' } });
  }

  if (condition.price_min) {
    and_arr.push({ price: { $gte: Number(condition.price_min) } });
  }
  if (condition.price_max) {
    and_arr.push({ price: { $lte: Number(condition.price_max) } });
  }

  if (condition.show_status === 'true') {
    and_arr.push({ show_status: 1 });
  }

  if (condition.status === 'true') {
    and_arr.push({ sell_status: 1 });
  }

  return { $and: and_arr };
}

function getQueryAggregate(condition) {
  let and_arr = [{
    deleted: false
  }];

  if (condition.keyword && condition.keyword !== '') {
    var or_arr = [
      { code: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } },
      { name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.municipality && condition.municipality !== 'all') {
    and_arr.push({ municipality: new mongoose.Types.ObjectId(condition.municipality) });
  }

  if (condition.location && condition.location !== 'all') {
    and_arr.push({ location: new mongoose.Types.ObjectId(condition.location) });
  }

  if (condition.operator && condition.operator !== '') {
    and_arr.push({ operator: { $regex: '.*' + condition.operator + '.*', $options: 'i' } });
  }

  if (condition.price_min) {
    and_arr.push({ price: { $gte: Number(condition.price_min) } });
  }
  if (condition.price_max) {
    and_arr.push({ price: { $lte: Number(condition.price_max) } });
  }

  if (condition.show_status === 'true') {
    and_arr.push({ show_status: 1 });
  }

  if (condition.status === 'true') {
    and_arr.push({ sell_status: 1 });
  }


  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  // Match munic
  let matchUser = {
    $and: [
      { 'munic.deleted': { $eq: false } }
    ]
  };

  // Match Municipality
  aggregates.push({
    $lookup: {
      from: 'municipalities',
      localField: 'municipality',
      foreignField: '_id',
      as: 'munic'
    }
  }, {
    $unwind: '$munic'
  }, {
    $match: matchUser
  },
  {
    $addFields: {
      munic_id: { $convert: { input: '$munic._id', to: 'string' } },
      munic_name: { $convert: { input: '$munic.name', to: 'string' } }
    }
  }
  );

  // Match location
  let matchLocation = {
    $and: [
      { 'location.deleted': { $eq: false } }
    ]
  };

  aggregates.push({
    $lookup: {
      from: 'locations',
      localField: 'location',
      foreignField: '_id',
      as: 'location'
    }
  }, {
    $unwind: '$location'
  }, {
    $match: matchLocation
  },
  {
    $addFields: {
      location_id: { $convert: { input: '$location._id', to: 'string' } },
      location_name: { $convert: { input: '$location.name', to: 'string' } }
    }
  }
  );

  aggregates.push({
    $project: {
      code: 1,
      'sell_status': 1,
      'show_status': 1,
      'name': 1,
      'price': 1,
      'capacity': 1,
      'expire': 1,
      'expire_detail': 1,
      'operator': 1,
      'is_set_stock_quantity': 1,
      'stock_quantity': 1,
      'is_set_max_quantity': 1,
      'max_quantity': 1,
      'is_deadline': 1,
      'deadline': 1,
      'description': 1,
      'avatar': 1,
      created: 1,
      munic_name: 1,
      munic_id: 1,
      location_name: 1,
      location_id: 1
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


function fieldAlow() {
  return [
    'sell_status',
    'show_status',
    'code',
    'name',
    'price',
    'capacity',
    'expire',
    'expire_detail',
    'operator',
    'is_set_stock_quantity',
    'stock_quantity',
    'is_set_max_quantity',
    'max_quantity',
    'is_deadline',
    'deadline',
    'description',
    'avatar,',
    'ship_method,',
    'ship_date,',
    'ship_company,',
    'is_accept_schedule,',
    'accepted_schedule,',
    'except_place,',
    'except_place_options,',
    'except_date,',
    'is_accept_noshi,'
  ];
}
