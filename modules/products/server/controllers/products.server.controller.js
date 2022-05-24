'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Product = mongoose.model('Product'),
  User = mongoose.model('User'),
  Event = mongoose.model('Event'),
  Using = mongoose.model('Using'),
  RequestItem = mongoose.model('RequestItem'),
  Municipality = mongoose.model('Municipality'),
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
    let data = req.body;
    let auth = req.user;

    // check exists code
    let conditionCheckProductCode = { product_code: data.code, municipality: auth.municipality || data.municipalityId, deleted: false };
    if (req.body.requestItemId) {
      conditionCheckProductCode._id = { $ne: req.body.requestItemId };
    }
    const [isExistsCodeInProduct, isExistsCodeInRequestItem] = await Promise.all([
      Product.findOne({ code: data.code, municipality: auth.municipality || data.municipalityId }).lean(),
      RequestItem.findOne(conditionCheckProductCode).lean()
    ]);

    if (isExistsCodeInProduct || isExistsCodeInRequestItem) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'products.form.code.error.exists') });
    }

    if (help.isAdminOrSubAdmin(req.user.roles)) {
      // Check permission
      let result = await help.checkPermission(FEATURE_MUNICIPALITY.CREATE_PRODUCT, 'municipality', data.municipalityId);

      // Add req.body.requestItemId in case munic rollback permission and admin update existing request items
      if (!req.body.requestItemId && result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (req.body.requestItemId || result.is_need_authorize) {
        let product = new Product(data);
        product.municipality = data.municipalityId;
        product.except_place_options = product.except_place_options.sort((a, b) => a - b);

        if (req.body.requestItemId) {
          await RequestItem.updateOne(
            { _id: req.body.requestItemId },
            { $set: { data: product, product_code: product.code } }
          );
        } else {
          let dataRequestItem = {
            municipality: data.municipalityId,
            data: product,
            type: FEATURE_MUNICIPALITY.CREATE_PRODUCT,
            product_code: product.code
          };
          let requestItem = new RequestItem(dataRequestItem);
          await requestItem.save();
        }

        return res.json(true);
      } else {
        let product = new Product(data);
        product.municipality = data.municipalityId;
        product.except_place_options = product.except_place_options.sort((a, b) => a - b);

        await product.save();
        return res.json(product);
      }

    } else {
      let product = new Product(data);
      // // 取扱い数量
      // if (product.is_set_stock_quantity === 1) {
      //   product.stock_quantity = 0;
      // }

      // // 購入上限
      // if (product.is_set_max_quantity === 1) {
      //   product.max_quantity = 0;
      // }
      product.municipality = auth.municipality;
      product.except_place_options = product.except_place_options.sort((a, b) => a - b);

      await product.save();
      return res.json(product);
    }
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
    var limit = help.getLimit(condition);
    var query = getQuery(condition, auth);
    var sort = help.getSort(condition);
    Product.paginate(query, {
      sort: sort,
      page: page,
      // populate: {
      //   path: 'subsidiary',
      //   select: 'name'
      // },
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
    let product = req.model;
    let data = req.body;

    // check exists code
    let conditionCheckProductCode = {
      product_code: data.code,
      municipality: auth.municipality || data.municipalityId,
      deleted: false,
      status: { $in: [REQUEST_ITEM_STATUSES.PENDING, REQUEST_ITEM_STATUSES.SUBMITTED] }
    };
    if (req.body.requestItemId) {
      conditionCheckProductCode._id = { $ne: req.body.requestItemId };
    }
    console.log(conditionCheckProductCode);
    const [isExistsCodeInProduct, isExistsCodeInRequestItem] = await Promise.all([
      Product.findOne({ code: data.code, municipality: auth.municipality || data.municipalityId, _id: { $ne: product._id } }).lean(),
      RequestItem.findOne(conditionCheckProductCode).lean()
    ]);
    console.log(isExistsCodeInProduct);
    console.log(isExistsCodeInRequestItem);
    if (isExistsCodeInProduct || isExistsCodeInRequestItem) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'products.form.code.error.exists') });
    }

    if (help.isAdminOrSubAdmin(req.user.roles)) {
      // Check permission
      let result = await help.checkPermission(FEATURE_MUNICIPALITY.UPDATE_PRODUCT, 'municipality', data.municipalityId);

      if (result.perrmision_error) {
        return res.status(422).json(result);
      }

      if (result.is_need_authorize) {
        const isRequestExists = await RequestItem.findOne({
          type: FEATURE_MUNICIPALITY.UPDATE_PRODUCT,
          product: product._id,
          municipality: data.municipalityId,
          status: { $in: [constants.REQUEST_ITEM_STATUS.PENDING, constants.REQUEST_ITEM_STATUS.SUBMITTED] },
          deleted: false
        }).lean();

        console.log(isRequestExists);
        if (isRequestExists && !req.body.requestItemId) {
          return res.status(422).send({ message: help.getMsLoc(lang, 'request_registration.server.error.request_update_product_existing') });
        }

        let dataChanged = {};
        _.forEach(Object.keys(data), (key) => {
          let value1 = product[key];
          let value2 = data[key];

          if (_.isArray(value2)) {
            if (!_.isArray(value1)) {
              value1 = [];
            }

            // Compare pictures, accepted_schedule, except_place_options
            if (arrayEquals(value2, value1)) {
              value1 = true;
              value2 = true;
            } else {
              value1 = false;
              value2 = true;
            }
          }

          if (value1) {
            value1 = value1.toString();
          }
          if (value2) {
            value2 = value2.toString();
          }

          if (value1 !== value2 && key !== 'created') {
            dataChanged[key] = data[key];

            if (key === 'is_set_stock_quantity' && value2 === 1) {
              dataChanged.stock_quantity = 0;
            }

            if (key === 'is_set_max_quantity' && value2 === 1) {
              dataChanged.max_quantity = 0;
            }

            if (key === 'sell_status' && value2 !== 1) {
              dataChanged.sell_status = 2;
            }

            if (key === 'show_status' && value2 !== 1) {
              dataChanged.show_status = 2;
            }

            if (key === 'except_place_options') {
              dataChanged.except_place_options = dataChanged.except_place_options.sort((a, b) => a - b);
            }
          }
        });

        if (req.body.requestItemId) {
          product = prepareDataUpdate(product, data);
          await RequestItem.updateOne(
            { _id: req.body.requestItemId },
            { $set: { data: dataChanged, product_code: dataChanged.code } }
          );
        } else {
          let dataRequestItem = {
            municipality: product.municipality,
            data: dataChanged,
            type: FEATURE_MUNICIPALITY.UPDATE_PRODUCT,
            product: product._id
          };
          if (dataChanged.code) {
            dataRequestItem.product_code = dataChanged.code;
          }
          let requestItem = new RequestItem(dataRequestItem);
          await requestItem.save();
        }

        return res.json(true);
      } else {
        product = prepareDataUpdate(product, data);
        await product.save();

        return res.json(product);
      }
    } else {
      product = prepareDataUpdate(product, data);
      await product.save();

      return res.json(product);
    }
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

  product.except_place_options = product.except_place_options.sort((a, b) => a - b);

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

exports.hasUsing = async function (req, res) {
  try {
    let municipalityId = req.user.municipality;
    if (req.user.roles[0] === constants.ROLE.ADMIN || req.user.roles[0] === constants.ROLE.SUB_ADMIN) {
      municipalityId = req.query.municipalityId;
    }
    Using.findOne({ deleted: false, municipality: municipalityId })
      .exec()
      .then(data => res.json(!!data));
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
  let municipalityId = auth.municipality;
  if (auth.roles[0] === constants.ROLE.ADMIN || auth.roles[0] === constants.ROLE.SUB_ADMIN) {
    municipalityId = condition.municipalityId;
  }
  var and_arr = [{ municipality: municipalityId }];
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
