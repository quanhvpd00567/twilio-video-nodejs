(function () {
  'use strict';
  angular.module('core').filter('format_time', getFormatTime);

  getFormatTime.$inject = ['TranslationService'];
  function getFormatTime(TranslationService) {
    return function (time) {
      var minutes = Math.floor(time / 60);
      var seconds = time - minutes * 60;
      seconds = Math.floor(seconds);
      // seconds = seconds ? Math.floor(seconds * 10) / 10 : seconds;

      var result = '';
      if (minutes) {
        result += minutes + TranslationService.translate('common.symbol.minutes');
      }

      if (!result) {
        if (seconds && seconds.toString().length === 1) {
          seconds = '0' + seconds.toString();
        }
        result += (seconds || 0) + TranslationService.translate('common.symbol.seconds');
      } else {
        if (seconds) {
          if (seconds.toString().length === 1) {
            seconds = '0' + seconds.toString();
          }
        } else {
          seconds = '00';
        }

        result += seconds + TranslationService.translate('common.symbol.seconds');
      }

      return result;
    };
  }
}());
