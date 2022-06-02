'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Order = mongoose.model('Order'),
  User = mongoose.model('User'),
  Municipality = mongoose.model('Municipality'),
  path = require('path'),
  _ = require('lodash'),
  config = require(path.resolve('./config/config')),
  moment = require('moment'),
  wanakana = require('wanakana'),
  fs = require('fs'),
  mailerServerUtil = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

const lang = 'ja';

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
    condition.sort_column = 'number';
    var sort = help.getSort(condition);
    await Order.paginate(query, {
      page: page,
      sort: sort,
      populate: [
        {
          path: 'products.product',
          select: 'name'
        },
        {
          path: 'municipality',
          select: 'name fee'
        }
      ],
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

exports.exportOrder = async function (req, res) {
  try {
    let conditions = {};
    if (req.query.id) {
      conditions._id = req.query.id;
    }
    const auth = req.user;
    var condition = req.query || {};
    var query = getQuery(condition, auth);
    condition.sort_column = 'number';
    var sort = help.getSort(condition);

    // var isUsageSystem = Number(condition.is_usage_system);

    let data = await Order.find(query)
      .sort(sort)
      .populate({
        path: 'products.product'
      })
      .lean();

    let conditionUsing = { municipality: req.user.municipality };

    let usings = await Using.find(conditionUsing)
      .sort({ created: 1 })
      .select('name deleted')
      .lean();

    // Get munic info:
    let munic = await Municipality.findOne({ _id: new mongoose.Types.ObjectId(auth.municipality) }).select('max_quantity is_usage_system').lean();

    let isError = false;
    let isHasEgg = false;
    let isHasRedHourse = false;
    let orderIsingIds = [];
    let orderOne = null;
    data.map(item => {
      if (item.using) {
        orderIsingIds.push(item.using._id.toString());
      }

      if (condition.id) {
        orderOne = item;
        // if (munic.is_usage_system === 1 && !isError) {
        //   isError = (item.is_usage_system !== munic.is_usage_system || !item.is_usage_system);
        // }

        // if (munic.is_usage_system === 2 && !isError) {
        //   isError = item.is_usage_system === 1;
        // }
      } else {
        if (condition.is_usage_system === 'all') {

          if (!isHasEgg) {
            isHasEgg = (item.is_usage_system === 2 || !item.is_usage_system);
          }

          if (!isHasRedHourse) {
            isHasRedHourse = (item.is_usage_system === 1);
          }

        } else {
          if (Number(condition.is_usage_system) === 1 && !isError) {
            isError = (item.is_usage_system !== Number(condition.is_usage_system) || !item.is_usage_system);
          }

          if (Number(condition.is_usage_system) === 2 && !isError) {
            isError = item.is_usage_system === 1;
          }
        }
      }

      return true;
    });

    if (!condition.id && condition.is_usage_system === 'all') {
      isError = isHasEgg && isHasRedHourse;
    }

    if (isError) {
      if (condition.id) {
        return res.status(422).send({ message: '異なる利用システムの注文データのため、出力できません。' });
      }
      return res.status(422).send({ message: '異なる利用システムの注文データが存在するので、出力できません。' });
    }


    let isNewFileFormatExport = false;
    if ((Number(condition.is_usage_system) === 1 && !condition.id)
      || (condition.is_usage_system === 'all' && !isHasEgg && isHasRedHourse)
      || (orderOne && orderOne.is_usage_system === 1)) {
      isNewFileFormatExport = true;
    }

    let maxGroupColumn = munic.max_quantity;

    const timePrefix = Date.now().toString();
    const pathFile = config.uploads.order.csv.exports;
    const outFileCsv = pathFile + timePrefix + '_order_export.csv';
    let writeStream = fs.createWriteStream(outFileCsv);

    if (isNewFileFormatExport) {
      // res.json({ a: true });
      let headerText = getHeaderCsvRedHouse(maxGroupColumn, null, null);

      writeStream.write(headerText.join(',') + '\n', () => { });
      data.forEach((someObject, index) => {
        let newLine = [];

        // 外部管理番号
        newLine.push('"' + someObject.number + '"');
        // 寄附申込日
        newLine.push(moment(someObject.created).format('YYYY-MM-DD'));
        // 払込票発送日
        newLine.push('""');
        // 入金処理日
        newLine.push(moment(someObject.created).format('YYYY-MM-DD'));
        // 名前
        newLine.push(someObject.last_name + '　' + someObject.first_name);
        // ふりがな
        newLine.push(someObject.last_name_kana + ' ' + someObject.first_name_kana);
        // 郵便番号
        newLine.push(formatZipcode(someObject.zip_code));
        // 都道府県
        newLine.push(someObject.prefecture);
        // 市区町村
        newLine.push(someObject.city);
        // 番地・マンション名
        let address = someObject.address || '';
        if (someObject.building) {
          address = address + someObject.building;
        }
        newLine.push(address);
        // 電話番号
        newLine.push(someObject.tel);
        // FAX番号
        newLine.push('""');
        // メールアドレス
        newLine.push(someObject.email);
        // 寄附金額
        newLine.push(someObject.total);
        // 寄附金の払込方法
        newLine.push('"クレジットカード"');
        // クレジット与信結果
        newLine.push('""');
        // 寄附金の使途
        let usingName = someObject.using ? someObject.using.name : '';
        newLine.push('"' + usingName + '"');
        // 同意確認
        newLine.push('""');
        // 寄附情報の公表
        newLine.push('""');
        // 地域広報誌等の送付
        newLine.push('""');
        // メールマガジン送付
        newLine.push('""');
        // ワンストップ特例_要望
        if (someObject.apply_is_need === 1) {
          newLine.push('"希望しない"');
        } else {
          newLine.push('"希望する"');
        }
        // ワンストップ特例_性別
        if (someObject.apply_is_need === 1) {
          newLine.push('""');
        } else {
          newLine.push(someObject.apply_sex === 1 ? '"男"' : '"女"');
        }
        // ワンストップ特例_生年月日
        if (someObject.apply_is_need === 1) {
          newLine.push('""');
        } else {
          newLine.push('"' + someObject.apply_birthday + '"');
        }
        // ワンストップ特例_返送確認日
        newLine.push('""');
        // 備考
        newLine.push('""');
        // お礼の品の辞退
        newLine.push('""');

        let allProducts = [];
        someObject.products.map(item => {
          for (let j = 0; j < item.quantity; j++) {
            allProducts.push(item);
          }
          return true;
        });

        let productFirst = null;
        // progress set product to csv
        // お礼の品_1 => お礼の品_maxGroupColumn
        for (let i = 1; i <= maxGroupColumn; i++) {
          let item = allProducts[i - 1];
          if (i === 1) {
            productFirst = item;
          }
          let pCodeName = '';
          if (item) {
            pCodeName = '[' + item.product.code + '] ' + item.product.name; // product code and name
          }
          newLine.push(pCodeName);
        }

        // お届け先_名前
        // お届け先_ふりがな -> お届け希望時間帯
        let pAddressTo = '';
        let pAddressfurigana = '';
        let pZipcode = '';
        let pPrefecture = '';
        let pCity = '';
        let pAddress = '';
        let pTel = '';
        if (productFirst.is_same_resident === 1) {
          pAddressTo = someObject.last_name + ' ' + someObject.first_name;
          pAddressfurigana = wanakana.toHiragana(someObject.last_name_kana + ' ' + someObject.first_name_kana);
          pZipcode = someObject.zip_code;
          pPrefecture = someObject.prefecture;
          pCity = someObject.city;
          pAddress = someObject.address || '';
          if (someObject.building) {
            pAddress = `${pAddress}${someObject.building}`;
          }
          pTel = someObject.tel;
        } else {
          pAddressTo = productFirst.last_name + ' ' + productFirst.first_name;
          pAddressfurigana = wanakana.toHiragana(productFirst.last_name_kana + ' ' + productFirst.first_name_kana);
          pZipcode = productFirst.zipcode;
          pPrefecture = productFirst.prefecture;
          pCity = productFirst.city;
          pAddress = productFirst.address || '';
          if (productFirst.building) {
            pAddress = `${pAddress}${productFirst.building}`;
          }
          pTel = productFirst.tel;
        }

        newLine.push('"' + pAddressTo + '"');
        newLine.push('"' + pAddressfurigana + '"');
        newLine.push('"' + formatZipcode(pZipcode) + '"');
        newLine.push('"' + pPrefecture + '"');
        newLine.push('"' + pCity + '"');
        newLine.push('"' + pAddress + '"');
        newLine.push('"' + pTel + '"');
        // お届け希望曜日
        newLine.push('""');
        // お届け希望時間帯
        if (productFirst.accepted_schedule === '指定なし') {
          newLine.push('"希望なし"');
        } else {
          newLine.push('"' + productFirst.accepted_schedule + '"');
        }
        // ご不在期間
        newLine.push('""');
        // お届け先_備考
        newLine.push('""');
        // アンケート_ご出身地
        newLine.push('""');
        // アンケート_性別
        newLine.push('""');
        // アンケート_年代
        newLine.push('""');
        // アンケート_生年
        newLine.push('""');
        // アンケート_動機
        newLine.push('""');
        // アンケート_何回目
        newLine.push('""');
        // アンケート_どこで知りましたか
        newLine.push('""');
        // アンケート_応援メッセージ
        newLine.push('""');


        // お届け先_書類_名前
        var docFullName = '';
        // 送り先_書類_郵便番号
        var docZipcode = '';
        // 送り先_書類_都道府県
        var docPrefecture = '';
        // 送り先_書類_市区町村
        var docCity = '';
        // お届け先_書類_番地・マンション名
        var docAddress = '';
        var docBuilding = '';
        // お届け先_書類_電話番号
        var docTel = '';
        var docAddressfurigana = '';

        if (someObject.doc_is_same_resident === 1) {
          docFullName = someObject.last_name + ' ' + someObject.first_name;
          docAddressfurigana = wanakana.toHiragana(someObject.last_name_kana + ' ' + someObject.first_name_kana);
          docZipcode = someObject.zip_code;
          docPrefecture = someObject.prefecture;
          docCity = someObject.city;
          docAddress = someObject.address || '';
          docBuilding = someObject.building ? someObject.building : '';
          docTel = someObject.tel;
        } else {
          docFullName = someObject.doc_add_last_name + ' ' + someObject.doc_add_first_name;
          docAddressfurigana = wanakana.toHiragana(someObject.doc_add_last_name_kana + ' ' + someObject.doc_add_first_name_kana);
          docZipcode = someObject.doc_add_zipcode;
          docPrefecture = someObject.doc_add_prefecture;
          docCity = someObject.doc_add_city;
          docAddress = someObject.doc_add_address || '';
          docBuilding = someObject.doc_add_building ? someObject.doc_add_building : '';
          docTel = someObject.doc_add_tel;
        }

        if (docBuilding) {
          docAddress = `${docAddress}${docBuilding}`;
        }

        // お届け先_書類_名前
        newLine.push('"' + docFullName + '"');
        // お届け先_書類_ふりがな
        newLine.push('"' + docAddressfurigana + '"');
        // お届け先_書類_郵便番号
        newLine.push('"' + formatZipcode(docZipcode) + '"');
        // お届け先_書類_都道府県
        newLine.push('"' + docPrefecture + '"');
        // お届け先_書類_市区町村
        newLine.push('"' + docCity + '"');
        // お届け先_書類_番地・マンション名
        newLine.push('"' + docAddress + '"');
        // お届け先_書類_電話番号
        newLine.push('"' + docTel + '"');

        writeStream.write(newLine.join(',') + '\n', () => { });
      });

      writeStream.end();

      writeStream.on('finish', () => {
        console.log('finish write stream, moving along');
        const promiseUpdate = data.map(async item => {
          if (item.export_status === 1) {
            return await Order.findOneAndUpdate({ _id: item._id }, { export_status: 2, export_date: new Date });
          }
        });

        Promise.all([promiseUpdate])
          .then((values) => {
            return res.json({
              url: outFileCsv
            });
          });
      }).on('error', (err) => {
        console.log(err);
      });

    } else {

      // set header to csv
      writeStream.write(getHeaderCsv(maxGroupColumn, usings, orderIsingIds).join(',') + '\n', () => { });

      data.forEach((someObject, index) => {
        let newLine = [];
        // 寄付者番号
        newLine.push('"' + someObject.number + '"');
        // 申込日
        newLine.push(moment(someObject.created).format('YYYY-MM-DD'));
        // 入金日
        newLine.push(moment(someObject.created).format('YYYY-MM-DD'));
        // 氏名
        newLine.push(someObject.last_name + '　' + someObject.first_name);
        // フリガナ
        newLine.push(wanakana.toKatakana(someObject.last_name_kana + ' ' + someObject.first_name_kana));
        // 〒
        newLine.push(formatZipcode(someObject.zip_code));
        // 都道府県
        newLine.push(someObject.prefecture);
        // 市区町村
        newLine.push(someObject.city);
        // 町名・番地
        newLine.push(someObject.address);
        // マンション名
        newLine.push(someObject.building ? someObject.building : '');
        // 電話番号
        newLine.push(someObject.tel);
        // E-mailアドレス
        newLine.push(someObject.email);
        // 寄附金額
        newLine.push(someObject.total);
        // 寄附金の払込方法
        newLine.push('"クレジットカード"');
        newLine.push('""');
        // チョイス決済状態
        newLine.push('""');

        usings.map(using => {
          if (!using.deleted || (using.deleted && orderIsingIds.includes(using._id.toString()))) {
            let uIsChoose = '';
            let uPoint = '';

            if (using && someObject.using && using._id.toString() === someObject.using._id.toString()) {
              uIsChoose = '○';
              uPoint = someObject.total;
            }

            newLine.push('"' + uIsChoose + '"');
            newLine.push('"' + uPoint + '"');
          }

          return true;
        });

        // 公表
        newLine.push('""');
        // 返礼品辞退
        newLine.push('""');

        let allProducts = [];
        someObject.products.map(item => {
          for (let j = 0; j < item.quantity; j++) {
            allProducts.push(item);
          }
          return true;
        });

        // progress set product to csv
        for (let i = 1; i <= maxGroupColumn; i++) {
          // 1 返礼品コード
          let pCode = '';
          // 2 返礼品名称
          let pName = '';
          // 3 配達希望日
          let pDayShip = '';
          // 4 配達希望時間
          let pTimeShip = '';
          // 5 発送仕様書出力日
          let pDayOutInfoShip = '';
          // 6 ヤマトB2出力日
          let pYamatoB2 = '';
          // 7 運送業者
          let pShiper = '';
          // 8 発送日
          let pDayOfShipment = '';
          // 9 発送メール送信日
          let pDaySendMailShip = '';
          // 10 請求確認日
          let pDayConfirmPayment = '';
          // 11 発注保留
          let pOrderPending = '';
          // 12 発注保留_事由
          let pOrderPendingReason = '';
          // 13 送り先_名前
          let pAddressTo = '';
          // 14 送り先_フリガナ
          let pAddressfurigana = '';
          // 15 郵便番号
          let pZipcode = '';
          // 16 都道府県
          let pPrefecture = '';
          // 17 市区町村
          let pCity = '';
          // 18 町名・番地
          let pAddress = '';
          // 19 マンション名
          let pBuilding = '';
          // 20 電話番号
          let pTel = '';
          // 21 最低寄付金額_お礼の品
          let pMinDonate = '';
          // 22 仕入値
          let pPrice = '';
          // 23 発送手数料
          let pFeeShip = '';

          let item = allProducts[i - 1];

          if (item) {
            pCode = item.product.code;
            pName = item.product.name;
            // accepted_schedule order
            pTimeShip = item.accepted_schedule ? item.accepted_schedule : '';

            switch (pTimeShip) {
              case '12:00 ～ 14:00':
                pTimeShip = '12～14時';
                break;
              case '14:00 ～ 16:00':
                pTimeShip = '14～16時';
                break;
              case '16:00 ～ 18:00':
                pTimeShip = '16～18時';
                break;
              case '19:00 ～ 21:00':
                pTimeShip = '19～21時';
                break;
              case '18:00 ～ 20:00':
                pTimeShip = '18～20時';
                break;
              case '20:00 ～ 21:00':
                pTimeShip = '20～21時';
                break;
              case '18:00 ～ 21:00':
                pTimeShip = '18～21時';
                break;
              case '指定なし':
                pTimeShip = '';
                break;
            }

            // set: 13 => 20
            if (item.is_same_resident === 1) {
              pAddressTo = someObject.last_name + ' ' + someObject.first_name;
              pAddressfurigana = wanakana.toKatakana(someObject.last_name_kana + ' ' + someObject.first_name_kana);
              pZipcode = someObject.zip_code;
              pPrefecture = someObject.prefecture;
              pCity = someObject.city;
              pAddress = someObject.address;
              pBuilding = someObject.building ? someObject.building : '';
              pTel = someObject.tel;
            } else {
              pAddressTo = item.last_name + ' ' + item.first_name;
              pAddressfurigana = wanakana.toKatakana(item.last_name_kana + ' ' + item.first_name_kana);
              pZipcode = item.zipcode;
              pPrefecture = item.prefecture;
              pCity = item.city;
              pAddress = item.address;
              pBuilding = item.building ? item.building : '';
              pTel = item.tel;
            }

            pZipcode = formatZipcode(pZipcode);

          }

          newLine.push('"' + pCode + '"');
          newLine.push('"' + pName + '"');
          newLine.push('"' + pDayShip + '"');
          newLine.push('"' + pTimeShip + '"');
          newLine.push('"' + pDayOutInfoShip + '"');
          newLine.push('"' + pYamatoB2 + '"');
          newLine.push('"' + pShiper + '"');
          newLine.push('"' + pDayOfShipment + '"');
          newLine.push('"' + pDaySendMailShip + '"');
          newLine.push('"' + pDayConfirmPayment + '"');
          newLine.push('"' + pOrderPending + '"');
          newLine.push('"' + pOrderPendingReason + '"');
          newLine.push('"' + pAddressTo + '"');
          newLine.push('"' + pAddressfurigana + '"');
          newLine.push('"' + pZipcode + '"');
          newLine.push('"' + pPrefecture + '"');
          newLine.push('"' + pCity + '"');
          newLine.push('"' + pAddress + '"');
          newLine.push('"' + pBuilding + '"');
          newLine.push('"' + pTel + '"');
          newLine.push('"' + pMinDonate + '"');
          newLine.push('"' + pPrice + '"');
          newLine.push('"' + pFeeShip + '"');
        }

        // 発送に関する連絡事項
        newLine.push('""');
        // 送り先_書類_名前
        var docFullName = '';
        // 送り先_書類_郵便番号
        var docZipcode = '';
        // 送り先_書類_都道府県
        var docPrefecture = '';
        // 送り先_書類_市区町村
        var docCity = '';
        // 送り先_書類_町名・番地
        var docAddress = '';
        // 送り先_書類_マンション名
        var docBuilding = '';
        if (someObject.doc_is_same_resident === 1) {
          docFullName = someObject.last_name + ' ' + someObject.first_name;
          docZipcode = someObject.zip_code;
          docPrefecture = someObject.prefecture;
          docCity = someObject.city;
          docAddress = someObject.address;
          docBuilding = someObject.building ? someObject.building : '';
        } else {
          docFullName = someObject.doc_add_last_name + ' ' + someObject.doc_add_first_name;
          docZipcode = someObject.doc_add_zipcode;
          docPrefecture = someObject.doc_add_prefecture;
          docCity = someObject.doc_add_city;
          docAddress = someObject.doc_add_address;
          docBuilding = someObject.doc_add_building ? someObject.doc_add_building : '';
        }

        docZipcode = formatZipcode(docZipcode);

        newLine.push('"' + docFullName + '"');
        newLine.push('"' + docZipcode + '"');
        newLine.push('"' + docPrefecture + '"');
        newLine.push('"' + docCity + '"');
        newLine.push('"' + docAddress + '"');
        newLine.push('"' + docBuilding + '"');

        // 納付案内状出力日
        newLine.push('""');
        // 払込取扱票出力日
        newLine.push('""');
        // 入金メール送信日
        newLine.push('""');
        // お礼状出力日
        newLine.push('""');
        // 寄付受領証明書出力日
        newLine.push('""');
        // ワンストップ特例_要望
        if (someObject.apply_is_need === 1) {
          newLine.push('"希望しない"');
        } else {
          newLine.push('"希望する"');
        }
        // ワンストップ特例_性別
        if (someObject.apply_is_need === 1) {
          newLine.push('""');
        } else {
          newLine.push(someObject.apply_sex === 1 ? '"男"' : '"女"');
        }
        // ワンストップ特例_生年月日
        if (someObject.apply_is_need === 1) {
          newLine.push('""');
        } else {
          newLine.push('"' + someObject.apply_birthday + '"');
        }
        // ワンストップ特例 CSV出力日
        newLine.push('""');

        // ワンストップ特例 申請書返送確認日
        newLine.push('""');
        // ワンストップ特例 返送受付番号
        newLine.push('""');
        // その他、
        // newLine.push('""');
        // その他、ご意見等ございましたら、ご記入ください。
        newLine.push('"' + someObject.note_question ? someObject.note_question : '' + '"');
        // ご記入ください。
        // newLine.push('""');
        // 応援メッセージ
        newLine.push('""');
        // 応援メッセージ 公表可否
        newLine.push('""');
        // 削除
        newLine.push('""');
        // 削除_理由
        newLine.push('""');
        // 備考
        newLine.push('""');
        // 調定日
        newLine.push('""');
        // 受付区分
        newLine.push('""');
        // オプトイン
        newLine.push('""');
        // 対応メモ
        newLine.push('""');
        // 外部管理番号
        newLine.push('""');
        // GMOオーダーID
        newLine.push('""');
        // 特定事業者コード付き寄付番号
        newLine.push('""');
        // 寄付有効無効
        newLine.push('""');

        writeStream.write(newLine.join(',') + '\n', () => { });
      });

      writeStream.end();

      writeStream.on('finish', () => {
        console.log('finish write stream, moving along');
        const promiseUpdate = data.map(async item => {
          if (item.export_status === 1) {
            return await Order.findOneAndUpdate({ _id: item._id }, { export_status: 2, export_date: new Date });
          }
        });

        Promise.all([promiseUpdate])
          .then((values) => {
            return res.json({
              url: outFileCsv
            });
          });
      }).on('error', (err) => {
        console.log(err);
      });
    }


  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.checkExported = async function (req, res) {
  try {
    const idOrder = req.query.id;
    const conditions = req.query;

    if (conditions.export_status !== '2' && !idOrder) {
      return res.json(null);
    }

    let query = { deleted: false, municipality: new mongoose.Types.ObjectId(req.user.municipality), export_status: 2 };
    if (idOrder) {
      query._id = conditions.id;
    }

    Order.findOne(query)
      .exec()
      .then(data => {
        return res.json(data);
      })
      .error(error => {
        return res.status(422).send({ message: help.getMsLoc() });
      });

  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.memberById = function (req, res, next, id) {
  const auth = req.user;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'お知らせが見つかりません。'
    });
  }

  User.findOne({ _id: id, deleted: false, roles: { $in: [constants.ROLE.MUNIC_ADMIN, constants.ROLE.MUNIC_MEMBER] }, municipality: auth.municipality })
    .exec(function (err, event) {
      if (err) {
        logger.error(err);
        return next(err);
      } else if (!event) {
        return next(new Error('お知らせが見つかりません。'));
      }

      req.model = event;
      next();
    });
};

exports.adminExport = async function (req, res) {
  try {
    const auth = req.user;
    var condition = req.query || {};
    // var query = getQuery(condition, auth);
    condition.sort_column = 'number';
    // var sort = help.getSort(condition);

    const aggregates = getQueryAggregate(condition);
    Order.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }).then(result => {

      const timePrefix = Date.now().toString();
      const pathFile = config.uploads.order.csv.exports;
      const outFileCsv = pathFile + timePrefix + '_order_export.csv';
      let writeStream = fs.createWriteStream(outFileCsv);

      // set header to csv
      const headers = ['申込番号', '自治体', '寄付金額', '内ポイント金額', '決済手数料', '注文日'];
      writeStream.write(headers.join(',') + '\n', () => { });
      console.log(result[0]);
      result.forEach((someObject, index) => {
        let newLine = [];
        newLine.push('"' + someObject.number + '"');
        newLine.push('"' + someObject.municipality ? someObject.munic_name : '' + '"');
        newLine.push('"' + '¥' + someObject.total + '"');
        newLine.push('"' + '¥' + someObject.point + '"');
        newLine.push('"' + '¥' + getOrderFee(someObject) + '"');
        newLine.push('"' + moment(someObject.created).format('YYYY/MM/DD HH:mm') + '"');

        writeStream.write(newLine.join(',') + '\n', () => { });
      });

      writeStream.end();

      writeStream.on('finish', () => {
        console.log('finish write stream, moving along');
        const newOutputExcelFileName = outFileCsv.replace('./', '');
        // let fullUrl = config.system.domain + newOutputExcelFileName;
        return res.json({
          url: outFileCsv
        });
      }).on('error', (err) => {
        console.log(err);
      });
    });
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }

  function getOrderFee(item) {
    if (!item.munic_fee || item.munic_fee === 0) {
      return 0;
    }

    return Math.floor((item.munic_fee * item.total) / 100);
  }
};

exports.adminList = async function (req, res) {
  const auth = req.user;
  var condition = req.query || {};
  var page = condition.page || 1;
  var limit = help.getLimit(condition);
  var options = { page: page, limit: limit };

  const aggregates = getQueryAggregate(condition);
  let result = await Order.aggregatePaginate(Order.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
  result = help.parseAggregateQueryResult(result, page);

  return res.json(result);
};

/** ====== PRIVATE ========= */
function getQuery(condition, auth) {
  var and_arr = [];
  if (help.isAdminOrSubAdmin(auth.roles)) {
    and_arr = [{ deleted: false }];
  } else {
    and_arr = [{ deleted: false, municipality: new mongoose.Types.ObjectId(auth.municipality) }];
  }

  if (condition.shingoren && condition.shingoren !== '') {
    var or_arr = [
      { last_name: { $regex: '.*' + condition.shingoren + '.*', $options: 'i' } },
      { first_name: { $regex: '.*' + condition.shingoren + '.*', $options: 'i' } },
      { last_name_kana: { $regex: '.*' + condition.shingoren + '.*', $options: 'i' } },
      { first_name_kana: { $regex: '.*' + condition.shingoren + '.*', $options: 'i' } }
    ];
    and_arr.push({ $or: or_arr });
  }

  if (condition.id) {
    and_arr.push({ _id: condition.id });
  }

  if (condition.tel && condition.tel !== '') {
    and_arr.push({ tel: { $regex: '.*' + condition.tel + '.*', $options: 'i' } });
  }

  if (condition.number && condition.number !== '') {
    and_arr.push({ number: { $regex: '.*' + condition.number + '.*', $options: 'i' } });
  }

  if (condition.export_status && condition.export_status !== '') {
    and_arr.push({ export_status: condition.export_status });
  }

  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  // if (condition.is_usage_system) {
  //   let arg = { $eq: 1 };
  //   if (condition.is_usage_system === '2') {
  //     arg = { $in: [null, 2] };
  //   }

  //   if (condition.is_usage_system === 'all') {
  //     arg = { $in: [null, 2, 1] };
  //   }

  //   and_arr.push({ is_usage_system: arg });
  // }

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

function getHeaderCsv(maxGroupColumn, usings, orderIsingIds) {
  let header = [
    '寄附者番号',
    '申込日',
    '入金日',
    '氏名',
    'フリガナ',
    '〒',
    '都道府県',
    '市区町村',
    '町名・番地',
    'マンション名',
    '電話番号',
    'E-mailアドレス',
    '寄附金額',
    '寄附金の払込方法',
    'チョイス支払番号',
    'チョイス決済状態'
  ];

  let headerUsing = [];

  usings.map(using => {
    if (!using.deleted || (using.deleted && orderIsingIds.includes(using._id.toString()))) {
      headerUsing.push(using.name + ' 選択');
      headerUsing.push(using.name + ' 金額');
    }

    return true;
  });

  let headerGourp3 = [
    '公表',
    '返礼品辞退'
  ];

  let headerProduct = [
    '返礼品_index_product__コード',
    '返礼品_index_product__名称',
    '返礼品_index_product__配達希望日',
    '返礼品_index_product__配達希望時間',
    '返礼品_index_product__発送仕様書出力日',
    '返礼品_index_product__ヤマトB2出力日',
    '返礼品_index_product__運送業者',
    '返礼品_index_product__発送日',
    '返礼品_index_product__発送メール送信日',
    '返礼品_index_product__請求確認日',
    '返礼品_index_product__発注保留',
    '返礼品_index_product__発注保留_事由',
    '返礼品_index_product__送り先_名前',
    '返礼品_index_product__送り先_フリガナ',
    '返礼品_index_product__送り先_郵便番号',
    '返礼品_index_product__送り先_都道府県',
    '返礼品_index_product__送り先_市区町村',
    '返礼品_index_product__送り先_町名・番地',
    '返礼品_index_product__送り先_マンション名',
    '返礼品_index_product__送り先_電話番号',
    '返礼品_index_product__最低寄附金額_お礼の品',
    '返礼品_index_product__仕入値',
    '返礼品_index_product__発送手数料'
  ];

  let groupColumnsProduct = [];
  for (let index = 1; index <= maxGroupColumn; index++) {
    let headerPro = headerProduct.map((item) => item.replace('_index_product_', index));
    groupColumnsProduct.push(headerPro);
  }

  let headerOther = [
    '発送に関する連絡事項',
    '送り先_書類_名前',
    '送り先_書類_郵便番号',
    '送り先_書類_都道府県',
    '送り先_書類_市区町村',
    '送り先_書類_町名・番地',
    '送り先_書類_マンション名',
    '納付案内状出力日',
    '払込取扱票出力日',
    '入金メール送信日',
    'お礼状出力日',
    '寄附受領証明書出力日',
    'ワンストップ特例_要望',
    'ワンストップ特例_性別',
    'ワンストップ特例_生年月日',
    'ワンストップ特例 CSV出力日',
    'ワンストップ特例 申請書返送確認日',
    'ワンストップ特例 返送受付番号',
    // 'その他、',
    'その他、ご意見等ございましたら、ご記入ください。',
    // 'ご記入ください。',
    '応援メッセージ',
    '応援メッセージ 公表可否',
    '削除',
    '削除_理由',
    '備考',
    '調定日',
    '受付区分',
    'オプトイン',
    '対応メモ',
    '外部管理番号',
    'GMOオーダーID',
    '特定事業者コード付き寄附番号',
    '寄附有効無効'
  ];

  var other = _.concat(header, headerUsing, headerGourp3, ...groupColumnsProduct, headerOther);

  return other;
}

function getHeaderCsvRedHouse(maxGroupColumn, x, y) {
  let header = [
    '外部管理番号',
    '寄附申込日',
    '払込票発送日',
    '入金処理日',
    '名前',
    'ふりがな',
    '郵便番号',
    '都道府県',
    '市区町村',
    '番地・マンション名',
    '電話番号',
    'FAX番号',
    'メールアドレス',
    '寄附金額',
    '寄附金の払込方法',
    'クレジット与信結果',
    '寄附金の使途',
    '同意確認',
    '寄附情報の公表',
    '地域広報誌等の送付',
    'メールマガジン送付',
    'ワンストップ特例_希望',
    'ワンストップ特例_性別',
    'ワンストップ特例_生年月日',
    'ワンストップ特例_返送確認日',
    '備考',
    'お礼の品の辞退'
  ];

  // お礼の品_x
  let headerProductNumber = [];

  for (let index = 1; index <= maxGroupColumn; index++) {
    headerProductNumber.push('お礼の品_' + index);
  }
  let header2 = [
    'お届け先_名前',
    'お届け先_ふりがな',
    'お届け先_郵便番号',
    'お届け先_都道府県',
    'お届け先_市区町村',
    'お届け先_番地・マンション名',
    'お届け先_電話番号',
    'お届け希望曜日',
    'お届け希望時間帯',
    'ご不在期間',
    'お届け先_備考',
    'アンケート_ご出身地',
    'アンケート_性別',
    'アンケート_年代',
    'アンケート_生年',
    'アンケート_動機',
    'アンケート_何回目',
    'アンケート_どこで知りましたか',
    'アンケート_応援メッセージ',
    'お届け先_書類_名前',
    'お届け先_書類_ふりがな',
    'お届け先_書類_郵便番号',
    'お届け先_書類_都道府県',
    'お届け先_書類_市区町村',
    'お届け先_書類_番地・マンション名',
    'お届け先_書類_電話番号'
  ];

  var other = _.concat(header, headerProductNumber, header2);

  return other;
}


function formatZipcode(zipcode) {
  if (!zipcode)
    return '';

  if (zipcode.length >= 7) {
    return zipcode.substring(0, 3) + '-' + zipcode.substring(3, zipcode.length);
  }

  return zipcode;
}
function getQueryAggregate(condition) {
  let and_arr = [{
    deleted: false
  }];

  if (condition.is_usage_system) {
    let arg = { $eq: 1 };
    if (condition.is_usage_system === '2') {
      arg = { $in: [null, 2] };
    }

    if (condition.is_usage_system === 'all') {
      arg = { $in: [null, 2, 1] };
    }

    and_arr.push({ is_usage_system: arg });
  }


  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }

  if (condition.number && condition.number !== '') {
    and_arr.push({ number: { $regex: '.*' + condition.number + '.*', $options: 'i' } });
  }


  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  // Match user
  let matchUser = {
    $and: [
      { 'munic.deleted': { $eq: false } }
    ]
  };

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
      munic_name: { $convert: { input: '$munic.name', to: 'string' } },
      munic_fee: '$munic.fee'
    }
  }
  );

  let second_and_arr = [];
  if (condition.munic_name && condition.munic_name !== '') {
    second_and_arr.push({ munic_name: { $regex: '.*' + condition.munic_name + '.*', $options: 'i' } });
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
      number: 1,
      total: 1,
      point: 1,
      created: 1,
      munic_name: 1,
      munic_fee: 1,
      munic_id: 1
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
