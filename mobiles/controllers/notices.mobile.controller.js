// 'use strict';

// /**
//  * Module dependencies
//  */
// var path = require('path'),
//   mongoose = require('mongoose'),
//   NoticeMessage = mongoose.model('NoticeMessage'),
//   translate = require(path.resolve('./config/locales/mobile/ja.json')),
//   logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller'));

// /**
// * @function 農家アプリ・お気に入り一覧
// * @param page
// * @returns { noticeMessages: list }
// * @version 2020/09/24
// */
// exports.m_list = function (req, res) {
//   var page = req.body.page || 1;
//   var current = new Date();
//   var query = {
//     user: req.user._id, deleted: false,
//     start_time: { $lte: current }, end_time: { $gt: current }
//   };

//   return NoticeMessage.paginate(query, {
//     sort: '-created',
//     page: page,
//     limit: 20
//   }).then(function (result) {
//     return res.jsonp(result);
//   }, err => {
//     logger.error(err);
//     return res.status(500).send({ message: 'サーバーエラーが発生しました。' });
//   });
// };

// /**
// * @function Count_Notice_Message
// * @returns { count: number }
// * @version 2020/09/24
// */
// exports.m_total = function (req, res) {
//   var current = new Date();
//   return NoticeMessage.countDocuments({
//     user: req.user._id, read: false, deleted: false,
//     start_time: { $lte: current }, end_time: { $gt: current }
//   }).then(function (result) {
//     return res.jsonp(result);
//   }, err => {
//     logger.error(err);
//     return res.status(500).send({ message: 'サーバーエラーが発生しました。' });
//   });
// };

// /**
// * @function 農家アプリ・農薬詳細情報
// * @param noticeMessageId
// * @returns { noiticeMessage: object }
// * @version 2020/09/24
// */
// exports.m_detail = function (req, res) {
//   var noticeMessageId = req.body.noticeMessageId;
//   var current = new Date();

//   if (!noticeMessageId)
//     return res.status(400).send({ message: 'このデータは既に削除されています。' });
//   if (!mongoose.Types.ObjectId.isValid(noticeMessageId))
//     return res.status(400).send({ message: 'このデータは既に削除されています。' });

//   return NoticeMessage.findOne({
//     user: req.user._id, _id: noticeMessageId, deleted: false,
//     start_time: { $lte: current }, end_time: { $gt: current }
//   })
//     .exec((err, noticeMessage) => {
//       if (err || !noticeMessage) {
//         return res.status(400).send({ message: 'このお知らせは既に削除されています。' });
//       }

//       return res.jsonp(noticeMessage);
//     });
// };

// /**
// * @function Delete_Notice_Message
// * @param noticeMessageId
// * @returns { result: boolean }
// * @version 2020/09/24
// */
// exports.m_delete = function (req, res) {
//   var noticeMessageId = req.body.noticeMessageId;

//   if (!noticeMessageId)
//     return res.status(400).send({ message: 'このデータは既に削除されています。' });
//   if (!mongoose.Types.ObjectId.isValid(noticeMessageId))
//     return res.status(400).send({ message: 'このデータは既に削除されています。' });

//   return NoticeMessage.findOneAndUpdate(
//     { user: req.user._id, _id: noticeMessageId, deleted: false },
//     { deleted: true },
//     { new: true }
//   ).exec(function (err, objs) {
//     if (err) {
//       logger.error(err);
//       return res.status(500).send({ message: 'サーバーエラーが発生しました。' });
//     }
//     return res.jsonp({ result: true });
//   });
// };

// /**
// * @function Read_Notice_Message
// * @param noticeMessageId
// * @returns { result: boolean }
// * @version 2020/09/24
// */
// exports.m_read = function (req, res) {
//   var noticeMessageId = req.body.noticeMessageId;

//   if (!noticeMessageId)
//     return res.status(400).send({ message: 'このデータは既に削除されています。' });
//   if (!mongoose.Types.ObjectId.isValid(noticeMessageId))
//     return res.status(400).send({ message: 'このデータは既に削除されています。' });

//   return NoticeMessage.findOne({
//     user: req.user._id, _id: noticeMessageId, deleted: false
//   })
//     .exec(async (err, noticeMessage) => {
//       if (err || !noticeMessage) {
//         return res.status(400).send({ message: 'このお知らせは既に削除されています。' });
//       }

//       noticeMessage.read = true;
//       await noticeMessage.save();

//       return res.jsonp({ result: true });
//     });
// };

// exports.get5LatestUnreadNotices = async function (req, res) {
//   try {
//     const current = new Date();
//     const query = {
//       read: false,
//       user: req.user._id, deleted: false,
//       start_time: { $lte: current }, end_time: { $gt: current }
//     };
//     const result = await NoticeMessage.find(query).sort('-created').limit(5).lean();
//     return res.jsonp(result);
//   } catch (error) {
//     logger.error(error);
//     return res.status(500).send({ message: 'サーバーエラーが発生しました。' });
//   }
// };
