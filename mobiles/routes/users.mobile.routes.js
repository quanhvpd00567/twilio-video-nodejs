'use strict';

module.exports = function (app) {
  var controller = require('../controllers/users.mobile.controller'),
    policy = require('../policies/core.mobile.policy.js');

  /**
 * @function ログイン
 * @param username(ログインID)
 * @param password(パスワード)
 * @param uuid
 * @returns { user: object }
 */
  app.route('/api/mobile/users/signin').post(policy.versionAllowed, controller.signin);
  /**
   * @function ログアウト
   * @returns Boolean
   */
  app.route('/api/mobile/users/signout').post(policy.tokenAllowed, controller.signout);
  /**
   * @function ChangePasword
   * @returns Boolean
   */

  /**
   * @function ログアウト
   * @returns Boolean
   */

  app.route('/api/mobile/users/change-password').post(policy.tokenAllowed, controller.changePassword);

  /**
 * @function ResetPassword
 * @returns Boolean
 */
  app.route('/api/mobile/users/reset-password').post(policy.versionAllowed, controller.resetPassword);

  /**
* @function Setting
* @returns {setting: object}
*/
  app.route('/api/mobile/users/setting').post(policy.tokenAllowed, controller.setting);

  /**
   * @function アカウント認証
   * @returns { user: object }
   */
  app.route('/api/mobile/users/token').post(policy.tokenAllowed, controller.verify_token);

  app.route('/api/mobile/users/profile').post(policy.tokenAllowed, controller.profile);
  app.route('/api/mobile/users/update_profile').post(policy.tokenAllowed, controller.update_profile);

  /**
  * @function システムデータ
  * @returns { config }
  */
  app.route('/api/mobile/users/config').post(controller.config);

  /**
* @function プッシュ通知ID変更
* @param registrationId
* @param uuid
* @returns
*/
  app.route('/api/mobile/users/registration').post(policy.tokenAllowed, controller.notif_registrationId);
  /** Count notification
  * @function notif_count
  * @returns { 200 }
  */
  app.route('/api/mobile/users/notif_clear').post(policy.tokenAllowed, controller.notif_clear);
  /** Decrease Notification
  * @function notif_decrease
  * @returns { 200 }
  */
  app.route('/api/mobile/users/notif_decrease').post(policy.tokenAllowed, controller.notif_decrease);
  /** User profile
 * @function profile
 * @returns { Object }
 */

  app.route('/api/mobile/users/update_email').post(policy.tokenAllowed, controller.update_email);

  /** Home
* @function home_info
* @returns { Object }
*/
  app.route('/api/mobile/users/home_info').post(policy.tokenAllowed, controller.home_info);
  app.route('/api/mobile/users/daily-activity').post(policy.tokenAllowed, controller.updateDailyActivity);
  app.route('/api/mobile/users/daily-activity/v2').post(policy.tokenAllowed, controller.updateDailyActivityV2);
  app.route('/api/mobile/users/get-daily-activity').post(policy.tokenAllowed, controller.getDailyActivity);
  app.route('/api/mobile/users/get-unexpired-points').post(policy.tokenAllowed, controller.getUnexpiredPoints);
  app.route('/api/mobile/users/point-logs').post(policy.tokenAllowed, controller.getPointHistories);

  app.route('/api/mobile/users/get-ec-site-token').post(policy.tokenAllowed, controller.generateTokenEcSite);
  app.route('/api/mobile/users/step-histories').post(policy.tokenAllowed, controller.getStepHistories);
  app.route('/api/mobile/users/contact').post(policy.tokenAllowed, controller.contact);

  app.route('/api/mobile/users/restore-department').post(controller.restoreDepartmentForUser);
  // app.route('/api/mobile/users/remove-dup-steps').post(controller.removeDupSteps);

};
