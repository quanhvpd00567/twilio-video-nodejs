'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  moment = require('moment-timezone'),
  Product = mongoose.model('Product'),
  Order = mongoose.model('Order'),
  Transaction = mongoose.model('Transaction'),
  logger = require(path.resolve('./mobiles/controllers/logger.mobile.controller')),
  veritransResultCode = require(path.resolve('./mobiles/controllers/veritrans-result-code.json')),
  creditServerController = require(path.resolve('./modules/core/server/controllers/credit.server.controller')),
  orderHandlingServerController = require(path.resolve('./modules/core/server/controllers/order-handling.queue.server.controller')),
  eventEmitterServerController = require(path.resolve('./modules/core/server/controllers/event-emitter.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  helpServer = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  mailerServerUtils = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  translate = require(path.resolve('./config/locales/mobile/ja.json'));

moment.tz.setDefault('Asia/Tokyo');
moment.locale('ja');

const orderHandlingQueue = orderHandlingServerController.getOrderHandlingQueue();
const eventEmitter = eventEmitterServerController.getEventEmitter();
const veritransResultCodes = Object.keys(veritransResultCode).map(code => {
  return { code: code, message: veritransResultCode[code] };
});

exports.validateProductsToOrder = async function (req, res) {
  try {
    let products = req.body.products || [];
    if (!products || products.length === 0) {
      return res.json({ success: true });
    }

    const productIds = products.map(item => item.productId);
    const productsToOrderPromises = productIds.map(productId => {
      return Product.findById(productId).lean();
    });
    const productsToOrder = await Promise.all(productsToOrderPromises);

    let _products = productsToOrder;
    _products = _products.map((item, index) => {
      item.orderQuantity = products[index].quantity;
      return item;
    });

    const errors = checkSellStatusAndQuantity(_products);
    if (errors && errors.length > 0) {
      return res.json({ success: false, errors });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({
      message: translate['system.server.error']
    });
  }
};

exports.submitOrder = async function (req, res) {
  try {
    const queueNumber = new Date().getTime() + (Math.random() + 1).toString(36).substring(7);
    const userId = req.user._id;
    orderHandlingQueue.push(function () {
      return handleOrder(req.body, userId, queueNumber, req.user.municipality, req.user.location);
    });

    eventEmitter.on('order_response', function (queueResponse) {
      if (queueResponse && queueResponse.jobId === queueNumber) {
        if (queueResponse.result) {
          delete queueResponse.result.queueNumber;
        }

        return res.json(queueResponse.result);
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({
      message: translate['system.server.error']
    });
  }
};

async function handleOrder(body, userId, queueNumber, municipalityId, locationId) {
  let session = null;
  try {
    /*
      - 1. Check deleted and sell_status of products
      - 2. Check stock quantity of products
      - 3. Check card token
      - 4. Minus Product.stockQuantity (if product.is_set_stock_quantity = 2), if stockQuantity = 0 -> set sellStatus = 2
      - 5. Create order
      - 6. Call api credit cart to payment (total) -> Create Transaction
     */
    let { card, cart } = body;
    if (!userId || !card || !cart || !cart.products || cart.products.length === 0) {
      return { queueNumber, success: false, message: translate['system.server.error'] };
    }

    const productIds = cart.products.map(item => item.productId);
    const productsToOrderPromises = productIds.map(productId => {
      return Product.findById(productId).lean();
    });
    let productsToOrder = await Promise.all(productsToOrderPromises);
    cart.products = cart.products.map((item, index) => {
      item.product = productsToOrder[index];
      return item;
    });

    let errors = [];
    // 1 & 2
    logger.info('\n\n---------- Start Order------------');
    logger.info('Checking Products was deleted or end sell or not enough quantity?');
    let _products = productsToOrder;
    _products = _products.map((item, index) => {
      item.orderQuantity = cart.products[index].quantity;
      return item;
    });

    errors = checkSellStatusAndQuantity(_products);
    if (errors && errors.length > 0) {
      logger.info('Respond errors: ' + errors.join(', '));
      return { queueNumber, success: false, errors };
    }

    // 3
    const cardToken = card.token;
    if (!cardToken) {
      logger.info('Respond errors: ' + translate['order.card.error.authorize_card'] + '- Card token null');
      return { queueNumber, success: false, message: translate['order.card.error.authorize_card'] };
    }

    logger.info('Call Veritrans api to authorize token');
    const response = await creditServerController.authorize(userId, cardToken);
    logger.info('Veritrans response' + JSON.stringify(response));
    const vResultCode = response.result && response.result.vResultCode;
    const checkVCode = handleVResponse(vResultCode);
    if (!checkVCode.isSuccess) {
      logger.info('Respond errors: ' + checkVCode.message);
      return { queueNumber, success: false, message: checkVCode.message };
    }

    const cardInfo = response.payNowIdResponse && response.payNowIdResponse.account
      && response.payNowIdResponse.account.cardInfo && response.payNowIdResponse.account.cardInfo[0];

    const cardIdOfVeritran = cardInfo && cardInfo.cardId;
    if (!cardInfo || !cardIdOfVeritran) {
      logger.info('Respond errors: ' + translate['order.card.error.authorize_card'] + ' No cardId from Veritran');
      return { queueNumber, success: false, message: translate['order.card.error.authorize_card'] };
    }

    logger.info('Start mongoose transaction');
    session = await mongoose.startSession();
    session.startTransaction();

    // 4
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

    // 5
    logger.info('Create order record');
    // generate order number
    const orderNumber = await generalNumberOrder();
    let orderObject = body;
    orderObject.number = orderNumber;
    orderObject.user = userId;
    orderObject.municipality = municipalityId;
    orderObject.location = locationId;
    orderObject.total = cart.total;

    const totalQuantity = cart.products.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
    orderObject.total_quantity = totalQuantity;
    orderObject.products = cart.products.map(item => {
      item.product = item.product._id;
      return item;
    });

    let orderCreated = new Order(orderObject);
    await orderCreated.save({ session });

    // 6
    logger.info('Call Veritrans api to payment');
    if (orderObject.total) {
      const response = await creditServerController.pay(userId, new Date().valueOf(), cardIdOfVeritran, orderObject.total);
      logger.info('Veritrans response' + JSON.stringify(response));
      const vResultCode = response && response.result && response.result.vResultCode;
      logger.info('vResultCode ' + JSON.stringify(vResultCode));

      const checkVCode = handleVResponse(vResultCode);
      let transactionOject = { user: userId, amount: orderObject.total };

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
      Order.findById(orderCreated._id).populate([
        { path: 'municipality', select: 'name prefecture', populate: { path: 'admin', select: 'email' } },
        { path: 'products.product' }
      ]).lean().exec().then(order => {
        // mapping order data to mail template
        order.products = order.products.map(item => {
          item.priceFormatted = helpServer.formatNumber(item.price * item.quantity);
          return item;
        });

        order.totalFormatted = helpServer.formatNumber(order.total);
        order.paymentDate = moment(order.created).format('YYYY年MM月DD日 HH:mm:ss');
        order.sendingApplicationFormValue = helpServer.getMasterDataValue('sending_application_forms', order.sending_application_form);
        if (order.sending_application_form === constants.SENDING_APPLICATION_FORM.YES) {
          order.applicationSexValue = helpServer.getMasterDataValue('application_sexes', order.application_sex);
          order.applyBirthdayValue = order.application_birthday || '';
          if (order.applyBirthdayValue) {
            order.applyBirthdayValue = order.applyBirthdayValue.replace('/', '年');
            order.applyBirthdayValue = order.applyBirthdayValue.replace('/', '月');
            order.applyBirthdayValue = order.applyBirthdayValue + '日';
          }
        }

        order.currentDate = moment().format('YYYY/MM/DD HH:mm:ss');
        order.building = order.building || '';

        mailerServerUtils.sendMailOrderSuccess(order.email, order);
        mailerServerUtils.sendMailOrderSuccessToMunicipality(order.municipality.admin.email, order);
      });
    } catch (error) {
      logger.error(error);
    }

    logger.info('Respond success');
    return { queueNumber, success: true };
  } catch (error) {
    abortTransaction();
    logger.error(error);
    logger.info('Respond errors: ' + translate['system.server.error']);
    return { queueNumber, success: false, message: translate['system.server.error'] };
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

function checkSellStatusAndQuantity(products) {
  let errors = [];
  for (const product of products) {
    if (product.deleted) {
      let message = translate['order.product.error.deleted'];
      message = message.replace('{0}', product.name);
      errors.push(message);
      continue;
    }

    if (product.show_status === 2 || product.sell_status === constants.SELL_STATUS.END_SALE) {
      let message = translate['order.product.error.end_sale'];
      message = message.replace('{0}', product.name);
      errors.push(message);
      continue;
    } else if ((product.is_set_stock_quantity === 2 && product.stock_quantity <= 0) && product.sell_status === constants.SELL_STATUS.ON_SALE) {
      let message = translate['order.product.error.sold_out'];
      message = message.replace('{0}', product.name);
      errors.push(message);
      continue;
    } else if ((product.is_set_stock_quantity === 2 && product.stock_quantity <= 0) && product.sell_status === constants.SELL_STATUS.END_SALE) {
      let message = translate['order.product.error.sold_out'];
      message = message.replace('{0}', product.name);
      errors.push(message);
      continue;
    }

    let maxQuantityOfProduct = getMaxQuantityOfProduct(product);
    if (maxQuantityOfProduct && product.orderQuantity && product.orderQuantity > maxQuantityOfProduct) {
      if (product.is_set_stock_quantity === 2 && maxQuantityOfProduct === product.stock_quantity) {
        let message = translate['order.product.error.order_over_stock_quantity'];
        message = message.replace('{0}', product.name);
        message = message.replace('{1}', maxQuantityOfProduct);
        errors.push(message);
      } else if (product.is_set_max_quantity === 2 && maxQuantityOfProduct === product.max_quantity) {
        let message = translate['order.product.error.order_over_max_quantity'];
        message = message.replace('{0}', product.name);
        message = message.replace('{1}', maxQuantityOfProduct);
        errors.push(message);
      }
      continue;
    }
  }

  return errors;
}

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

async function generalNumberOrder() {
  var start = moment().startOf('day');
  var end = moment().endOf('day');

  let count = await Order
    .countDocuments({ created: { $gte: start, $lte: end } });

  if (count === 0) {
    return '27' + moment().format('YYMMDD0001');
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

  return '27' + moment().format('YYMMDD') + number;
}

function handleVResponse(vResultCode) {
  if (!vResultCode) {
    return { isSuccess: false, message: translate['order.card.error.authorize_card'] };
  }

  if (vResultCode.indexOf(constants.V_RESULT_CODES_SUCCESS.CODE_1) !== -1 || vResultCode.indexOf(constants.V_RESULT_CODES_SUCCESS.CODE_2) !== -1) {
    return { isSuccess: true };
  } else {
    // Get veritrans error message (follow file excel) and return
    const veritransCodeItem = veritransResultCodes.find(item => vResultCode.indexOf(item.code) !== -1);
    const errorMessage = veritransCodeItem && veritransCodeItem.message || translate['order.card.error.authorize_card'];

    return { isSuccess: false, message: errorMessage };
  }
}
