(function () {
  'use strict';
  angular.module('core').filter('format_point', getFormatPoint);

  getFormatPoint.$inject = ['TranslationService', '$filter'];
  function getFormatPoint(TranslationService, $filter) {
    return function (number, isOriginal, isWithoutUnit) {
      if (!number) {
        return 0 + (isWithoutUnit ? '' : TranslationService.translate('common.label.unit.point'));
      }

      if (isOriginal) {
        var numberSplitted = number.toString().split('.');
        var numberOfDecimal = numberSplitted[1] ? numberSplitted[1].length : 0;
        return $filter('number')(number, numberOfDecimal) + TranslationService.translate('common.label.unit.point');
      }

      number = Math.floor(number);
      return $filter('number')(number) + (isWithoutUnit ? '' : TranslationService.translate('common.label.unit.point'));
    };
  }
}());
