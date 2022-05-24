(function () {
  'use strict';
  angular.module('core').filter('format_money2', getFormatMoney);

  getFormatMoney.$inject = ['TranslationService', '$filter'];
  function getFormatMoney(TranslationService, $filter) {
    return function (amount, isOriginal) {
      if (!amount && amount !== 0) {
        return TranslationService.translate('common.label.undefined_value');
      }

      if (isOriginal) {
        var numberSplitted = amount.toString().split('.');
        var numberOfDecimal = numberSplitted[1] ? numberSplitted[1].length : 0;
        return '¥' + $filter('number')(amount, numberOfDecimal);
      }

      amount = Math.floor(amount);
      return '¥' + $filter('number')(amount);
    };
  }
}());
