(function () {
  'use strict';
  angular.module('core').filter('notice_status', getNoticeStatus);

  getNoticeStatus.$inject = ['TranslationService'];
  function getNoticeStatus(TranslationService) {
    return function (notice) {
      if (!notice || !notice.start_time || !notice.end_time) {
        return '';
      }

      var today = new Date();
      if (today < new Date(notice.start_time)) {
        return TranslationService.translate('notice.list.delivery_status.undelivered');
      } else if (today >= new Date(notice.start_time) && today <= new Date(notice.end_time)) {
        return TranslationService.translate('notice.list.delivery_status.during_delivery');
      } else if (today > new Date(notice.end_time)) {
        return TranslationService.translate('notice.list.delivery_status.expired');
      }

      return '';
    };
  }
}());
