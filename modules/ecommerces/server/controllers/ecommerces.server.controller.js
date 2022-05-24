'use strict';


var mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  User = mongoose.model('User'),
  Using = mongoose.model('Using'),
  Municipality = mongoose.model('Municipality'),
  AddressMaster = mongoose.model('AddressMaster'),
  Product = mongoose.model('Product'),
  Config = mongoose.model('Config'),
  Transaction = mongoose.model('Transaction'),
  Cart = mongoose.model('Cart'),
  Card = mongoose.model('Card'),
  Order = mongoose.model('Order'),
  Notice = mongoose.model('Notice'),
  NoticeRead = mongoose.model('NoticeRead'),
  Point = mongoose.model('Point'),
  PointLog = mongoose.model('PointLog'),
  PaymentHistory = mongoose.model('PaymentHistory'),
  path = require('path'),
  _ = require('lodash'),
  moment = require('moment-timezone'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  creditServerController = require(path.resolve('./modules/core/server/controllers/credit.server.controller')),
  veritransResultCode = require(path.resolve('./modules/ecommerces/server/controllers/veritrans-result-code.json')),
  orderHandlingServerController = require(path.resolve('./modules/core/server/controllers/order-handling.queue.server.controller')),
  mailerServerUtils = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

moment.tz.setDefault('Asia/Tokyo');
moment.locale('ja');

const orderHandlingQueue = orderHandlingServerController.getOrderHandlingQueue();
const veritransResultCodes = Object.keys(veritransResultCode).map(code => {
  return { code: code, message: veritransResultCode[code] };
});

exports.get3LatestNotices = async function (req, res) {
  try {
    const userId = req.user._id;
    const companyId = req.user.company;
    const municipalityIds = await getMunicipalityIdsHasActivePoints(userId);
    const aggregates = getQueryAggregatesFor3LatestNotices(userId, companyId, municipalityIds);
    let result = await Notice.aggregate(aggregates).limit(3).allowDiskUse(true);
    return res.json(result);
  } catch (error) {
    logger.error(error);
  }
};

exports.pagingNotices = async function (req, res) {
  try {
    const userId = req.user._id;
    const companyId = req.user.company;
    const municipalityIds = await getMunicipalityIdsHasActivePoints(userId);

    let condition = req.body.condition || {};

    const page = condition.page || 1;
    const limit = help.getLimit(condition);
    const options = { page: page, limit: limit };
    const aggregates = getQueryAggregatesForPagingNotices(userId, companyId, municipalityIds);

    let result = await Notice.aggregatePaginate(Notice.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
  } catch (error) {
    logger.error(error);
  }
};

exports.getNoticeById = async function (req, res) {
  try {
    const userId = req.user._id;
    const noticeId = req.params.noticeId;
    const noticeReadObject = { notice: noticeId, user: userId };
    const [notice, noticeRead] = await Promise.all([
      Notice.findOne({ deleted: false, _id: noticeId }).lean(),
      NoticeRead.findOne(noticeReadObject).lean()
    ]);

    if (notice && !noticeRead) {
      NoticeRead.create(noticeReadObject);
    }

    return res.json(notice);
  } catch (error) {
    logger.error(error);
  }
};

exports.pagingProducts = async function (req, res) {
  const userId = req.user._id;
  const [municipalityIds, configObject] = await Promise.all([
    getMunicipalityIdsHasActivePoints(userId),
    Config.findOne({}).select('max_point').lean()
  ]);

  var condition = req.body.condition || {};
  var page = condition.page || 1;
  var limit = help.getLimit(condition);
  var queryAggregate = getQueryAggregatesForPagingProducts(condition, municipalityIds);

  Product.aggregatePaginate(Product.aggregate(queryAggregate).allowDiskUse(true).collation({ locale: 'ja' }), {
    page: page,
    limit: limit
  })
    .then(function (result) {
      result.page = page;
      result.docs = result.data;

      delete result.data;
      result.totalPages = result.pageCount;
      delete result.pageCount;
      result.totalDocs = result.totalCount;
      result.page = page;
      result.nextPage = page < result.totalPages;
      delete result.totalCount;
      result.configObject = configObject;

      return res.jsonp(result);
    })
    .catch(function (error) {
      logger.error(error);
      return res.status(422).send({ message: help.getMsLoc() });
    });
};

exports.getProductById = async function (req, res) {
  try {
    const productId = req.params.productECId;
    const product = await Product.findOne({ _id: productId })
      .populate({
        path: 'municipality',
        select: 'is_apply_times max_quantity is_setting_gift_bows is_usage_system'
      })
      .populate({
        path: 'using',
        select: 'name'
      }).lean();

    return res.json(product);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getProductDetail = async function (req, res) {
  try {
    return res.json(req.product);

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getUsing = function (req, res) {
  try {
    let curentDatetime = new Date();
    const municId = req.params.municId;
    const query = {
      deleted: false, municipality: new mongoose.Types.ObjectId(municId),
      $and: [
        {
          $or: [
            { start: { $lte: curentDatetime }, end: { $gte: curentDatetime } },
            { start: null, end: null },
            { start: null, end: { $gte: curentDatetime } },
            { start: { $lte: curentDatetime }, end: null }
          ]
        }
      ]

    };
    Using.find(query)
      .select('name description')
      .exec()
      .then(using => res.json(using));

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getAddrees = function (req, res) {
  try {
    const zipcode = req.params.zipcode;

    AddressMaster.find({ zipcode: { $eq: String(zipcode) } })
      .exec().
      then(data => {
        if (data.length === 1) {
          // case 4;
          if (data[0].town.includes('（')) {
            data[0].town = data[0].town.split('（')[0];
          }

          if (data[0].town.includes('場合') || data[0].town.includes('一円')) {
            data[0].town = '';
          }

          return res.json(data[0]);
        }

        let town = '';
        if (data.length > 1) {
          let result = data[0];
          let townFirst = data[0].town;
          let townLast = data[data.length - 1].town;
          // case 1;
          if (townFirst.includes('（') || townLast.includes('）')) {
            town = data.map(item => {
              return item.town;
            });

            result.town = town;

            if (result.town.includes('（')) {
              result.town = result.town.split('（')[0];
            }

            return res.json(result);
          }

          // case 2 && case 3;;
          let codes = [];
          data.map(item => {
            if (!codes.includes(item.code)) {
              codes.push(item.code);
            }
            return true;
          });

          if (codes.length > 0) {
            result.town = '';
            return res.json(result);
          }
        }

        return res.json(null);
      });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getMunicInfo = function (req, res) {
  try {
    Municipality.findOne({ deleted: false, _id: new mongoose.Types.ObjectId(req.params.municId) })
      .then(munic => res.json(munic))
      .error(error => {
        logger.error(error);
        return res.status(422).send({ message: help.getMsLoc() });
      });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getCart = function (req, res) {
  try {
    Cart.findOne({ user: new mongoose.Types.ObjectId(req.user._id), municipality: new mongoose.Types.ObjectId(req.params.municId), is_order: false })
      .sort({ _id: -1 })
      .populate(
        {
          path: 'products.product',
          select: 'name ship_date is_accept_schedule accepted_schedule is_accept_noshi'
        }
      )
      .then(cart => res.json(cart))
      .error(error => {
        logger.error(error);
        return res.status(422).send({ message: help.getMsLoc() });
      });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.pagingOrders = async function (req, res) {
  try {
    const auth = req.user;
    var condition = req.body.condition;
    var page = condition.page || 1;
    var limit = help.getLimit(condition);
    var query = getQueryOrder(condition, auth);
    var sort = help.getSort(condition);

    return await Order.paginate(query, {
      page: page,
      populate: [
        {
          path: 'products.product',
          select: 'name'
        },
        { path: 'municipality', select: 'name' }
      ],
      limit: limit,
      sort: sort,
      collation: { locale: 'ja' }
    }).then(function (result) {
      return res.json(result);
    });

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getOrderById = async function (req, res) {
  try {
    const auth = req.user;
    const orderId = req.params.orderECId;
    const order = await Order.findOne({ _id: orderId, user: auth._id })
      .populate({
        path: 'municipality',
        select: 'name prefecture'
      })
      .populate({
        path: 'products.product',
        select: 'ship_date name'
      })
      .populate({
        path: 'using',
        select: 'name description'
      }).lean();
    return res.json(order);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

// token from veritrans, authorize again and save into Card Table
exports.addCard = async function (req, res) {
  try {
    const { token, token_expire_date, is_save_card } = req.body;
    if (!token || !token_expire_date) {
      return res.status(422).send({ message: help.getMsLoc() });
    }
    const userId = req.user._id;

    const response = await creditServerController.authorize(userId, token);
    const vResultCode = response.result && response.result.vResultCode;
    const checkVCode = handleVResponse(vResultCode);
    if (!checkVCode.isSuccess) {
      return res.status(422).send({ message: checkVCode.message });
    }

    const cardInfo = response.payNowIdResponse && response.payNowIdResponse.account
      && response.payNowIdResponse.account.cardInfo && response.payNowIdResponse.account.cardInfo[0];
    if (!cardInfo) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'ecommerce.order.server.error.authorize_card_error') });
    }

    const cardObject = {
      user: userId,
      card_id: cardInfo.cardId,
      card_number: cardInfo.cardNumber,
      token: token, token_expire_date: token_expire_date,
      card_expire_date: cardInfo.cardExpire,
      is_save_card: is_save_card || false
    };
    const card = await Card.create(cardObject);
    return res.json(card);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.submitOrder = async function (req, res) {
  try {
    const queueNumber = new Date().getTime();
    const userId = req.user._id;
    orderHandlingQueue.push(function () {
      return handleOrder(req.body, userId, queueNumber);
    });
    return res.json(queueNumber);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

async function handleOrder(body, userId, queueNumber) {
  let session = null;
  try {
    /*
      - 1. Check deleted and sell_status of products
      - 2. Check stock quantity of products
      - 3. Check points of user (if points_used !== 0)
      - 4. Call api credit cart to payment (totalAmount) -> Create Transaction
      - 5. Minus points_used & create PointLog
      - 6. Set cart.is_order = true
      - 7. Minus Product.stockQuantity (if product.is_set_stock_quantity = 2), if stockQuantity = 0 -> set sellStatus = 2
      - 8. Create order
      - 9. Create or Update PaymentHistory
     */
    let { cartId, info: dataInfo, info_contact: contact, docs, apply, card, products } = body;
    let others = {
      zip_code: body.zipcode,
      prefecture: body.prefecture,
      city: body.city,
      address: body.address,
      building: body.building,
      using: body.usingId
    };
    if (body.note_question) {
      others.note_question = body.note_question;
    }

    // progress contact info
    contact.tel = contact.phone;
    delete contact.phone;

    // progress apply
    if (apply.apply_is_need === 2) {
      apply.apply_birthday = apply.apply_birthday_year + '/' + apply.apply_birthday_month + '/' + apply.apply_birthday_day;
      delete apply.apply_birthday_year;
      delete apply.apply_birthday_month;
      delete apply.apply_birthday_day;
    }
    if (!card) {
      logger.info('Respond errors: ' + help.getMsLoc('ja', 'ecommerce.order.server.error.card_not_found'));
      return { queueNumber, success: false, message: help.getMsLoc('ja', 'ecommerce.order.server.error.card_not_found') };
    }

    const getCartPromise = Cart.findById(cartId).populate([{ path: 'products.product' }, { path: 'municipality' }]).lean();
    const [cart, pointsOfUser] = await Promise.all([
      getCartPromise,
      getMunicipalitiesHasActivePoints(userId)
    ]);

    others.is_usage_system = cart.municipality.is_usage_system;

    if (!cart) {
      logger.info('Respond errors: ' + help.getMsLoc('ja', 'ecommerce.cart.server.error.not_found'));
      return { queueNumber, success: false, message: help.getMsLoc('ja', 'ecommerce.cart.server.error.not_found') };
    }

    // 1 & 2
    logger.info('Checking Products was deleted or end sell or not enough quantity?');
    let _products = cart.products.map(item => item.product);
    _products = JSON.parse(JSON.stringify(_products));
    _products = _products.map((item, index) => {
      item.orderQuantity = cart.products[index].quantity;
      return item;
    });

    const errors = checkSellStatusAndQuantity(_products);
    if (errors && errors.length > 0) {
      logger.info('Respond errors: ' + errors.join(', '));
      return { queueNumber, success: false, errors };
    }

    // 3
    logger.info('Checking Points valid?');
    const municipalityId = cart.municipality._id;
    if (cart.points_used) {
      const pointsOfUserInMunicipalities = pointsOfUser.reduce((result, item) => {
        if (result[item.municipality_id.toString()]) {
          result[item.municipality_id.toString()] += item.points;
        } else {
          result[item.municipality_id.toString()] = item.points;
        }
        return result;
      }, {});

      const pointsOfUserInMunicipality = pointsOfUserInMunicipalities && pointsOfUserInMunicipalities[municipalityId.toString()];
      if (!pointsOfUserInMunicipality) {
        let message = help.getMsLoc('js', 'ecommerce.order.server.error.user_points_not_enough');
        logger.info('Respond errors: ' + message);
        return { queueNumber, success: false, message };
      }
      if (pointsOfUserInMunicipality < cart.points_used) {
        let message = help.getMsLoc('js', 'ecommerce.order.server.error.user_points_not_enough');
        logger.info('Respond errors: ' + message);
        return { queueNumber, success: false, message };
      }
    }

    let cardId;
    let cardIdOfVeritran;
    // Check is_save_card = false, get token and authorize
    if (card.is_new_card && !card.is_save_card) {
      const cardToken = card.token;
      if (!cardToken) {
        logger.info('Respond errors: ' + help.getMsLoc('ja', 'ecommerce.order.server.error.authorize_card_error'));
        return { queueNumber, success: false, message: help.getMsLoc('ja', 'ecommerce.order.server.error.authorize_card_error') };
      }

      const response = await creditServerController.authorize(userId, cardToken);
      const vResultCode = response.result && response.result.vResultCode;
      const checkVCode = handleVResponse(vResultCode);
      if (!checkVCode.isSuccess) {
        logger.info('Respond errors: ' + checkVCode.message);
        return { queueNumber, success: false, message: checkVCode.message };
      }

      const cardInfo = response.payNowIdResponse && response.payNowIdResponse.account
        && response.payNowIdResponse.account.cardInfo && response.payNowIdResponse.account.cardInfo[0];

      cardIdOfVeritran = cardInfo && cardInfo.cardId;
      if (!cardInfo || !cardIdOfVeritran) {
        logger.info('Respond errors: ' + help.getMsLoc('ja', 'ecommerce.order.server.error.authorize_card_error'));
        return { queueNumber, success: false, message: help.getMsLoc('ja', 'ecommerce.order.server.error.authorize_card_error') };
      }
    } else {
      // progress card
      cardId = card.old_card_id;
      const cardObject = await Card.findById(card.old_card_id);
      cardIdOfVeritran = cardObject && cardObject.card_id;
      if (!cardObject || !cardIdOfVeritran) {
        logger.info('Respond errors: ' + help.getMsLoc('ja', 'ecommerce.order.server.error.card_not_found'));
        return { queueNumber, success: false, message: help.getMsLoc('ja', 'ecommerce.order.server.error.card_not_found') };
      }
    }

    let orderObject = _.merge({}, others, dataInfo, contact, docs, apply);
    orderObject.card = cardId;
    orderObject.user = userId;
    orderObject.municipality = municipalityId;
    orderObject.total = cart.subtotal;
    orderObject.pay_amount = cart.total_amount;
    orderObject.point = cart.points_used;

    // products of order
    const productsOfOrder = cart.products.map(item => {
      let product = item;
      if (products[product.product._id.toString()]) {
        product = _.merge(product, products[product.product._id.toString()]);
        product.is_same_resident = Number(products[product.product._id.toString()].is_same_resident);
      }
      return product;
    });
    orderObject.products = productsOfOrder;

    logger.info('Generate order no');
    const orderNumber = await generalNumberOrder();
    orderObject.number = orderNumber;
    let order = new Order(orderObject);
    const totalQuantity = cart.products.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
    order.total_quantity = totalQuantity;

    logger.info('Start mongoose transaction');
    session = await mongoose.startSession();
    session.startTransaction();

    const orderId = order._id;
    // 5
    logger.info('Minus points of user + create PointLog record (If using point to order)');
    let pointsUsed = cart.points_used;
    if (pointsUsed) {
      let condition = buildConditionsQueryActivePoints(userId);
      condition.municipality = municipalityId;
      let points = await Point.find(condition).sort({ expire: 1 });
      if (!points || points.length === 0) {
        abortTransaction();
        let message = help.getMsLoc('js', 'ecommerce.order.server.error.user_points_not_enough');
        logger.info('Respond errors: ' + message);
        return { queueNumber, success: false, message };
      }

      let savePointsPromises = [];
      for (let i = 0; i < points.length; i++) {
        let item = points[i];
        if (item.points >= pointsUsed) {
          item.points -= pointsUsed;
          pointsUsed = 0;
          savePointsPromises.push(item.save({ session }));
          break;
        } else {
          pointsUsed -= item.points;
          item.points = 0;
          savePointsPromises.push(item.save({ session }));
        }
      }

      await Promise.all(savePointsPromises);

      const pointLogObject = {
        user: userId, type: constants.POINT_LOG_TYPE.USE,
        municipality: municipalityId,
        order: orderId, points: cart.points_used
      };
      let pointLog = new PointLog(pointLogObject);
      await pointLog.save({ session });
    }

    // 6
    logger.info('Update cart.is_order = true');
    await Cart.updateOne({ _id: cartId }, { is_order: true, updated: new Date() }, { session });

    // 7
    logger.info('Minis stock quantity of products');
    const updateProductPromises = cart.products.map(item => {
      const product = item.product;
      let updateData;
      if (product.is_set_stock_quantity === 2) {
        updateData = { $inc: { stock_quantity: -item.quantity } };
        if (product.stock_quantity === item.quantity) {
          updateData.sell_status = constants.SELL_STATUS.END_SALE;
        }
      }
      if (updateData) {
        return Product.updateOne({ _id: product._id }, updateData, { session });
      } else {
        return null;
      }
    });
    await Promise.all(updateProductPromises);

    // 8
    logger.info('Create order record');
    await order.save({ session });

    // 9
    logger.info('Create or update PaymentHistory record of current month');
    const year_month = help.generateYearMonthOfPaymentHistory();
    let paymentHistoryCondition = { municipality: municipalityId, year_month: year_month, deleted: false };
    let paymentHistoryUpdate = { $inc: { points: cart.points_used, amount: cart.total_amount }, municipality: municipalityId, updated: new Date() };
    await PaymentHistory.findOneAndUpdate(
      paymentHistoryCondition, paymentHistoryUpdate,
      { setDefaultsOnInsert: true, new: true, upsert: true },
    ).session(session);

    // 4
    logger.info('Call Veritrans api to payment');
    if (cart.total_amount) {
      const response = await creditServerController.pay(userId, new Date().valueOf(), cardIdOfVeritran, cart.total_amount);
      const vResultCode = response && response.result && response.result.vResultCode;

      const checkVCode = handleVResponse(vResultCode);
      let transactionOject = { user: userId, card: cardId, amount: cart.total_amount };

      if (!checkVCode.isSuccess) {
        transactionOject.status = constants.TRANSACTION_STATUS.FAILED;
        transactionOject.error = checkVCode.message;
        createTransactionLog(transactionOject);

        abortTransaction();
        logger.info('Respond errors: ' + checkVCode.message);
        return { queueNumber, success: false, message: checkVCode.message };
      }

      transactionOject.status = constants.TRANSACTION_STATUS.SUCCESS;
      createTransactionLog(transactionOject);
    }

    logger.info('Commit mongoose Transaction');
    await session.commitTransaction();
    session.endSession();

    // order success -> send mail
    try {
      Order.findById(order._id).populate([
        { path: 'using', select: 'name' },
        { path: 'municipality', select: 'name prefecture contact_name contact_mail contact_tel fax' },
        { path: 'products.product' }
      ]).lean().exec().then(order => {
        // mapping order data to mail template
        order.products = order.products.map(item => {
          item.priceFormatted = help.formatNumber(item.price);

          if (item.is_same_resident === 1) {
            item.first_name = order.first_name;
            item.last_name = order.last_name;
            item.first_name_kana = order.first_name_kana;
            item.last_name_kana = order.last_name_kana;
            item.tel = order.tel;
            item.zipcode = order.zip_code;
            item.prefecture = order.prefecture;
            item.city = order.city;
            item.address = order.address;
            item.building = order.building || '';
          }
          return item;
        });
        order.payAmountFormatted = help.formatNumber(order.pay_amount);
        order.totalFormatted = help.formatNumber(order.total);

        if (order.point) {
          order.pointFormatted = help.formatNumber(order.point);
        }
        order.paymentValue = help.getMasterDataValue('order_payments', order.payment);
        order.paymentDate = moment(order.created).format('YYYY年MM月DD日 HH:mm:ss');
        order.applyIsNeedValue = help.getMasterDataValue('order_apply_is_need', order.apply_is_need);
        order.applySexValue = help.getMasterDataValue('order_apply_sex', order.apply_sex);

        order.applyBirthdayValue = order.apply_birthday || '';
        if (order.applyBirthdayValue) {
          order.applyBirthdayValue = order.applyBirthdayValue.replace('/', '年');
          order.applyBirthdayValue = order.applyBirthdayValue.replace('/', '月');
          order.applyBirthdayValue = order.applyBirthdayValue + '日';
        }

        if (order.doc_is_same_resident === 1) {
          order.doc_add_first_name = order.first_name;
          order.doc_add_last_name = order.last_name;
          order.doc_add_first_name_kana = order.first_name_kana;
          order.doc_add_last_name_kana = order.last_name_kana;
          order.doc_add_tel = order.tel;
          order.doc_add_zipcode = order.zip_code;
          order.doc_add_prefecture = order.prefecture;
          order.doc_add_city = order.city;
          order.doc_add_address = order.address;
          order.doc_add_building = order.building || '';
        } else {
          order.doc_add_building = order.doc_add_building || '';
        }

        order.currentDate = moment().format('YYYY/MM/DD HH:mm:ss');
        order.building = order.building || '';

        let userName = `${order.last_name} ${order.first_name}`;
        order.userName = userName;

        // send mail to employee
        mailerServerUtils.sendMailOrderSuccess(order.email, order);

        // send mail to munic admin and munic member
        User.find({ deleted: false, municipality: order.municipality._id, roles: { $in: [constants.ROLE.MUNIC_ADMIN, constants.ROLE.MUNIC_MEMBER] } })
          .select('email')
          .lean().exec().then(municUsers => {
            order.municName = order.municipality && order.municipality.name || '';
            const municUserEmails = municUsers.map(item => item.email);
            if (municUserEmails.length > 0) {
              mailerServerUtils.sendMailOrderSuccessToMunicAdminAndMunicMember(municUserEmails, order);
            }
          }).catch(error => {
            logger.error(error);
          });
      });
    } catch (error) {
      logger.error(error);
    }

    logger.info('Respond success');
    return { queueNumber, success: true };
  } catch (error) {
    abortTransaction();
    logger.error(error);
    logger.info('Respond errors: ' + help.getMsLoc());
    return { queueNumber, success: false, message: help.getMsLoc() };
  }

  function abortTransaction() {
    if (session) {
      logger.info('Rollback Transaction');
      session.abortTransaction().then(() => {
        session.endSession();
      });
    }
  }

  async function createTransactionLog(body) {
    logger.info('Create Transaction Log record');
    await Transaction.create(body);
    return true;
  }
}

exports.checkMappingMunic = function (req, res) {
  try {
    Municipality.findOne({
      deleted: false,
      _id: new mongoose.Types.ObjectId(req.params.municId),
      prefecture: { $eq: String(req.query.prefecture) },
      name: { $eq: String(req.query.city) }
    })
      .exec()
      .then(munic => res.json(!!munic))
      .error(error => {
        logger.error(error);
        return res.status(422).send({ message: help.getMsLoc() });
      });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getMunicipalitiesHasActivePoints = async function (req, res) {
  try {
    return res.json(await getMunicipalitiesHasActivePoints(req.user._id));
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

async function getMunicipalitiesHasActivePoints(userId) {
  const aggregates = getQueryAggregatesForMunicipalitiesHasActivePoints(userId);
  let result = await Point.aggregate(aggregates).allowDiskUse(true);
  return result;
}

exports.removeCard = async function (req, res) {
  try {
    Card.updateOne({ user: req.user._id, _id: new mongoose.Types.ObjectId(req.body.card_id) }, { deleted: true })
      .exec()
      .then(data => res.json({ status: true }))
      .error(error => {
        logger.error(error);
        return res.status(422).send({ message: help.getMsLoc() });
      });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getUsingById = async function (req, res) {
  try {
    Using.findOne({ deleted: false, _id: new mongoose.Types.ObjectId(req.params.usingId), municipality: new mongoose.Types.ObjectId(req.params.municId) })
      .exec()
      .then(data => res.json(data))
      .error(error => {
        logger.error(error);
        return res.status(422).send({ message: help.getMsLoc() });
      });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.addOrUpdateCart = async function (req, res) {
  try {
    // cart : { municipalityId, productId, quantity, isFromTop }
    const cart = req.body && req.body.cart;
    if (!cart) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    const userId = req.user._id;
    let [cartItem, productOrigin, municipality] = await Promise.all([
      Cart.findOne({ user: userId, municipality: cart.municipalityId, is_order: false }),
      Product.findOne({ deleted: false, _id: cart.productId }).lean(),
      Municipality.findById(cart.municipalityId).select('max_quantity')
    ]);

    const quantity = cart.quantity;

    // Validate with municipality.max_quantity
    const totalQuantityInCart = cartItem && cartItem.products ? cartItem.products.reduce((result, item) => {
      return result + item.quantity;
    }, 0) : 0;
    if (municipality.max_quantity && (totalQuantityInCart + quantity) > municipality.max_quantity) {
      let message = help.getMsLoc('ja', 'ecommerce.cart.controller.message.error_max_quantity_per_order');
      message = message.replace('{0}', municipality.max_quantity);
      return res.status(422).send({ message: message });
    }

    // Validate quantity
    const maxQuantityOfProduct = getMaxQuantityOfProduct(productOrigin);
    if (maxQuantityOfProduct !== null && quantity && quantity > maxQuantityOfProduct) {
      let message;
      if (maxQuantityOfProduct > 0) {
        if (productOrigin.is_set_stock_quantity === 2 && maxQuantityOfProduct === productOrigin.stock_quantity) {
          message = help.getMsLoc('ja', 'ecommerce.order.server.error.product_stock_quantity');
          message = message.replace('{0}', productOrigin.name);
          message = message.replace('{1}', maxQuantityOfProduct);
        } else if (productOrigin.is_set_max_quantity === 2 && maxQuantityOfProduct === productOrigin.max_quantity) {
          message = help.getMsLoc('ja', 'ecommerce.order.server.error.product_max_quantity');
          message = message.replace('{0}', productOrigin.name);
          message = message.replace('{1}', maxQuantityOfProduct);
        }
      } else {
        message = help.getMsLoc('ja', 'ecommerce.cart.server.error.product_sold_out');
      }
      return res.status(422).send({ message: message });
    }

    if (cartItem) {
      // update quantity and amount or add product into products
      let product = cartItem.products.find(item => item.product.toString() === cart.productId.toString());
      if (product) {
        if (cart.isFromTop) {
          if (maxQuantityOfProduct !== null && (product.quantity + quantity) > maxQuantityOfProduct) {
            let message;
            if (maxQuantityOfProduct > 0) {
              message = help.getMsLoc('ja', 'ecommerce.cart.server.error.quantity_greater_max_quantity');
              message = message.replace('{0}', maxQuantityOfProduct);
            } else {
              message = help.getMsLoc('ja', 'ecommerce.cart.server.error.product_sold_out');
            }
            return res.status(422).send({ message: message });
          } else {
            product.quantity += quantity;
            product.price = productOrigin.price;
          }
        } else {
          product.quantity = cart.quantity;
          product.price = productOrigin.price;
        }
      } else {
        cartItem.products.push({ product: cart.productId, quantity: cart.quantity, price: productOrigin.price });
      }
      cartItem.updated = new Date();
      await cartItem.save();
    } else {
      const newCartItem = {
        user: userId,
        municipality: cart.municipalityId,
        updated: new Date(),
        products: [
          { product: cart.productId, quantity: cart.quantity, price: productOrigin.price }
        ]
      };
      await Cart.create(newCartItem);
    }

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getCardById = async function (req, res) {
  try {
    Card.findOne({ deleted: false, user: new mongoose.Types.ObjectId(req.user._id), _id: req.params.cardId })
      .exec()
      .then(data => res.json(data))
      .error(error => {
        logger.error(error);
        return res.status(422).send({ message: help.getMsLoc() });
      });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.getCartsPending = async function (req, res) {
  try {
    const userId = req.user._id;
    let [carts, municipalities, configObject] = await Promise.all([
      Cart.find({ user: userId, is_order: false })
        .sort({ updated: -1, created: -1 })
        .populate([
          {
            path: 'products.product',
            select: 'name avatar price is_set_stock_quantity stock_quantity is_set_max_quantity max_quantity sell_status show_status deleted'
          },
          {
            path: 'municipality',
            select: 'prefecture name max_quantity'
          }
        ]).lean(),
      getMunicipalitiesHasActivePoints(userId),
      Config.findOne({}).lean()
    ]);

    const pointsOfMunicipalities = municipalities.reduce((result, item) => {
      if (result[item.municipality_id.toString()]) {
        result[item.municipality_id.toString()] += item.points;
      } else {
        result[item.municipality_id.toString()] = item.points;
      }
      return result;
    }, {});

    carts = carts.map(cart => {
      // binding points of user in municipality
      const municipalityId = cart.municipality && cart.municipality._id && cart.municipality._id.toString();
      cart.pointsOfMunicipality = municipalityId && pointsOfMunicipalities[municipalityId] || 0;

      // binding max product quantity of order
      cart.products = cart.products.map(item => {
        item.maxQuantity = null;
        if (item.product) {
          item.maxQuantity = getMaxQuantityOfProduct(item.product);
          item.product.isStoppedSell = item.product.deleted || item.product.sell_status === constants.SELL_STATUS.END_SALE || item.product.show_status === 2;
        }
        return item;
      });
      return cart;
    });

    return res.json({ carts, configObject });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

function getMaxQuantityOfProduct(product) {
  let maxQuantity = null;
  if (!product) {
    return maxQuantity;
  }
  if (product.is_set_stock_quantity === 2 && product.is_set_max_quantity === 2) {
    maxQuantity = product.stock_quantity < product.max_quantity ? product.stock_quantity : product.max_quantity;
  } else if (product.is_set_stock_quantity === 2) {
    maxQuantity = product.stock_quantity;
  } else if (product.is_set_max_quantity === 2) {
    maxQuantity = product.max_quantity;
  }

  return maxQuantity;
}

exports.removeProductFromCart = async function (req, res) {
  try {
    const { productId, cartId } = req.body;
    if (!productId || !cartId) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(422).send({ message: help.getMsLoc('ja', 'ecommerce.cart.server.error.not_found') });
    }

    if (cart.products && cart.products.length === 1 && cart.products[0].product.toString() === productId.toString()) {
      await Cart.deleteOne({ _id: cartId });
    } else {
      await Cart.updateOne({ _id: cart }, { $pull: { products: { product: productId } }, updated: new Date() });
    }

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.saveCartInfo = async function (req, res) {
  try {
    const cartId = req.params.cartId;
    const { pointsUsed, totalAmount, subtotal, products } = req.body.cart;
    if (!cartId) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    const getProductPromises = products.map(item => {
      return Product.findById(item.product._id).lean();
    });
    let _products = await Promise.all(getProductPromises);
    _products = _products.map((item, index) => {
      item.orderQuantity = products[index].quantity;
      return item;
    });

    const errors = checkSellStatusAndQuantity(_products);
    if (errors && errors.length > 0) {
      return res.json({ success: false, errors: errors });
    }

    await Cart.updateOne({ _id: cartId }, { points_used: pointsUsed, total_amount: totalAmount, subtotal: subtotal, products, updated: new Date() });
    return res.json({ success: true });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

function checkSellStatusAndQuantity(products) {
  let errors = [];
  for (const product of products) {
    if (product.deleted) {
      let message = help.getMsLoc('ja', 'ecommerce.cart.server.error.product_deleted');
      message = message.replace('{0}', product.name);
      errors.push(message);
      continue;
    }

    if ((product.is_set_stock_quantity === 2 && product.stock_quantity <= 0) && product.sell_status === constants.SELL_STATUS.ON_SALE) {
      let message = help.getMsLoc('ja', 'ecommerce.order.server.error.product_sold_out');
      message = message.replace('{0}', product.name);
      errors.push(message);
      continue;
    } else if (product.sell_status === constants.SELL_STATUS.END_SALE && (product.is_set_stock_quantity === 2 && product.stock_quantity > 0)) {
      let message = help.getMsLoc('ja', 'ecommerce.order.server.error.product_end_sale');
      message = message.replace('{0}', product.name);
      errors.push(message);
      continue;
    } else if ((product.is_set_stock_quantity === 2 && product.stock_quantity <= 0) && product.sell_status === constants.SELL_STATUS.END_SALE) {
      let message = help.getMsLoc('ja', 'ecommerce.order.server.error.product_sold_out');
      message = message.replace('{0}', product.name);
      errors.push(message);
      continue;
    } else if (product.show_status === 2) {
      let message = help.getMsLoc('ja', 'ecommerce.order.server.error.product_end_sale');
      message = message.replace('{0}', product.name);
      errors.push(message);
      continue;
    }

    let maxQuantityOfProduct = getMaxQuantityOfProduct(product);
    if (maxQuantityOfProduct && product.orderQuantity && product.orderQuantity > maxQuantityOfProduct) {
      if (product.is_set_stock_quantity === 2 && maxQuantityOfProduct === product.stock_quantity) {
        let message = help.getMsLoc('ja', 'ecommerce.order.server.error.product_stock_quantity');
        message = message.replace('{0}', product.name);
        message = message.replace('{1}', maxQuantityOfProduct);
        errors.push(message);
      } else if (product.is_set_max_quantity === 2 && maxQuantityOfProduct === product.max_quantity) {
        let message = help.getMsLoc('ja', 'ecommerce.order.server.error.product_max_quantity');
        message = message.replace('{0}', product.name);
        message = message.replace('{1}', maxQuantityOfProduct);
        errors.push(message);
      }
      continue;
    }
  }

  return errors;
}

exports.lastestOrder = async function (req, res) {
  try {
    Order.findOne({ deleted: false, user: new mongoose.Types.ObjectId(req.user._id) })
      .sort({ _id: -1 })
      .select('last_name first_name last_name_kana first_name_kana tel email email_confirm zip_code prefecture city address building')
      .exec()
      .then(data => res.json(data));
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

async function generalNumberOrder() {
  var start = moment().startOf('day');
  var end = moment().endOf('day');

  let count = await Order
    .countDocuments({ created: { $gte: start, $lte: end } });

  if (count === 0) {
    return moment().format('YYMMDD0001');
  }

  let number = '';
  if (count < 9) {
    number = '000' + (count + 1);
  }

  if (count >= 9 && count < 99) {
    number = '00' + (count + 1);
  }

  if (count >= 99 && count < 999) {
    number = '0' + (count + 1);
  }

  if (count >= 999) {
    number = count + 1;
  }

  return moment().format('YYMMDD') + number;
}

async function getMunicipalityIdsHasActivePoints(userId) {
  const condition = buildConditionsQueryActivePoints(userId);
  const points = await Point.find(condition).select('municipality').populate({ path: 'municipality', select: 'is_testing' }).lean();
  let municipalityIds = [];
  points.forEach(point => {
    const isExisting = municipalityIds.find(municipalityId => point && point.municipality && municipalityId.toString() === point.municipality._id.toString());
    if (!isExisting && !point.municipality.is_testing) {
      municipalityIds.push(point.municipality._id);
    }
  });

  return municipalityIds;
}

function getQueryAggregatesFor3LatestNotices(userId, companyId, municipalityIds) {
  const today = new Date();
  let match_condition = buildMatchConditionsForNotice(today, companyId, municipalityIds);
  let aggregates = [];
  aggregates.push({
    $match: match_condition
  });

  aggregates.push({
    $lookup: {
      from: 'noticereads',
      let: { notice_id: '$_id', user_id: userId },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$deleted', false] },
              { $eq: ['$user', '$$user_id'] },
              { $eq: ['$notice', '$$notice_id'] }
            ]
          }
        }
      }],
      as: 'noticeRead'
    }
  }, {
    $unwind: {
      path: '$noticeRead',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      isRead: { $cond: ['$noticeRead', true, false] }
    }
  });

  aggregates.push({
    $sort: { start_time: -1 }
  });

  return aggregates;
}

function getQueryAggregatesForPagingNotices(userId, companyId, municipalityIds) {
  const today = new Date();
  let match_condition = buildMatchConditionsForNotice(today, companyId, municipalityIds);
  let aggregates = [];
  aggregates.push({
    $match: match_condition
  });

  aggregates.push({
    $lookup: {
      from: 'noticereads',
      let: { notice_id: '$_id', user_id: userId },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              { $eq: ['$deleted', false] },
              { $eq: ['$user', '$$user_id'] },
              { $eq: ['$notice', '$$notice_id'] }
            ]
          }
        }
      }],
      as: 'noticeRead'
    }
  }, {
    $unwind: {
      path: '$noticeRead',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $addFields: {
      isRead: { $cond: ['$noticeRead', true, false] }
    }
  });

  aggregates.push({
    $sort: { start_time: -1 }
  });

  return aggregates;
}

function buildMatchConditionsForNotice(today, companyId, municipalityIds) {
  return {
    deleted: false, start_time: { $lt: today }, end_time: { $gt: today },
    $and: [
      {
        $or: [
          { target: constants.NOTICE_TARGET.ALL },
          {
            target: constants.NOTICE_TARGET.CONDITION,
            companies: new ObjectId(companyId),
            municipalities: { $in: municipalityIds }
          },
          {
            target: constants.NOTICE_TARGET.CONDITION,
            companies: new ObjectId(companyId),
            municipalities: []
          },
          {
            target: constants.NOTICE_TARGET.CONDITION,
            companies: [],
            municipalities: { $in: municipalityIds }
          }
        ]
      }
    ]
  };
}

function getQueryAggregatesForMunicipalitiesHasActivePoints(userId) {
  const match_condition = buildConditionsQueryActivePoints(userId);
  let aggregates = [];
  aggregates.push({
    $match: match_condition
  });
  aggregates.push({
    $addFields: {
      yearMonthDate: {
        $concat: [
          { $toString: { $year: { date: '$expire', timezone: 'Asia/Tokyo' } } }, '/',
          { $toString: { $month: { date: '$expire', timezone: 'Asia/Tokyo' } } }, '/',
          { $toString: { $dayOfMonth: { date: '$expire', timezone: 'Asia/Tokyo' } } }
        ]
      }
    }
  });

  aggregates.push({
    $group: {
      _id: {
        municipality: '$municipality',
        expire: '$yearMonthDate'
      },
      points: { $sum: '$points' },
      doc: {
        '$first': '$$ROOT'
      }
    }
  }, {
    $addFields: {
      municipality: '$_id.municipality',
      expire: '$_id.expire',
      expire_date: '$doc.expire',
      points: '$points'
    }
  });

  aggregates.push({
    $lookup: {
      from: 'municipalities',
      localField: 'municipality',
      foreignField: '_id',
      as: 'municipality'
    }
  }, {
    $unwind: {
      path: '$municipality',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $match: {
      $and: [
        { 'municipality.deleted': { $eq: false } },
        {
          $or: [
            { 'municipality.is_testing': null },
            { 'municipality.is_testing': false }
          ]
        }
      ]
    }
  }, {
    $addFields: {
      municipality_id: '$municipality._id',
      municipality_name: { $concat: ['$municipality.prefecture', '$municipality.name'] }
    }
  }, {
    $project: {
      municipality: 0
    }
  });

  aggregates.push({
    $project: {
      _id: 0,
      municipality: 0
    }
  });

  aggregates.push({
    $sort: { expire_date: 1 }
  });

  return aggregates;
}

function buildConditionsQueryActivePoints(userId) {
  const today = new Date();
  return {
    deleted: false, user: new ObjectId(userId), is_expired: false,
    expire: { $gt: today }, points: { $gt: 0 }
  };
}

function getQueryAggregatesForPagingProducts(condition, municipalities) {
  const aggregate_arr = [];
  const and_arr = [{ municipality: { $in: municipalities }, deleted: false, show_status: 1 }];
  let sort;

  switch (condition.sort_option) {
    case 0:
      sort = {
        'munic_code': -1,
        'sell_status': 1,
        'created': -1
      };
      break;
    case 1:
      sort = {
        'price': -1,
        'created': -1
      };
      break;
    case 2:
      sort = {
        'price': 1,
        'created': -1
      };
      break;
    default:
      sort = {
        'munic_code': -1,
        'created': -1
      };
  }

  if (condition.municId) {
    and_arr.push({ 'muniObject._id': new ObjectId(condition.municId) });
  }

  if (condition.price_min) {
    and_arr.push({ price: { $gte: Number(condition.price_min) } });
  }
  if (condition.price_max) {
    and_arr.push({ price: { $lte: Number(condition.price_max) } });
  }

  aggregate_arr.push({
    $lookup: {
      from: 'municipalities',
      localField: 'municipality',
      foreignField: '_id',
      as: 'muniObject'
    }
  });

  aggregate_arr.push({ '$unwind': '$muniObject' });

  aggregate_arr.push({
    $match: {
      $and: and_arr
    }
  });


  aggregate_arr.push({
    $project: {
      'stock_quantity': 1,
      'avatar': 1,
      'name': 1,
      'price': 1,
      'created': 1,
      'sell_status': 1,
      'muniObject.prefecture': 1,
      'muniObject.name': 1,
      'muniObject._id': 1,
      munic_code: '$muniObject.code'
    }
  });

  aggregate_arr.push({
    '$sort': sort
  });

  return aggregate_arr;
}

function getQueryOrder(condition, auth) {
  var and_arr = [{ deleted: false, user: auth._id }];

  if (condition.orderYear) {
    and_arr.push({ created: { $gte: moment(condition.orderYear).startOf('year'), $lte: moment(condition.orderYear).endOf('year') } });
  }

  return { $and: and_arr };
}

function handleVResponse(vResultCode) {
  if (!vResultCode) {
    return { isSuccess: false, message: help.getMsLoc('ja', 'ecommerce.order.server.error.authorize_card_error') };
  }

  if (vResultCode.indexOf(constants.V_RESULT_CODES_SUCCESS.CODE_1) !== -1 || vResultCode.indexOf(constants.V_RESULT_CODES_SUCCESS.CODE_2) !== -1) {
    return { isSuccess: true };
  } else {
    // Get veritrans error message (follow file excel) and return
    const veritransCodeItem = veritransResultCodes.find(item => vResultCode.indexOf(item.code) !== -1);
    const errorMessage = veritransCodeItem && veritransCodeItem.message || help.getMsLoc('ja', 'ecommerce.order.server.error.authorize_card_error');

    return { isSuccess: false, message: errorMessage };
  }
}
