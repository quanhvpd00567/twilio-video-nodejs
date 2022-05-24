(function () {
  'use strict';
  angular.module('core').filter('format_currency', getFormatMoney);

  getFormatMoney.$inject = ['TranslationService', '$filter'];
  function getFormatMoney(TranslationService, $filter) {
    return function (amount, isOriginal) {
      if (!amount && amount !== 0) {
        return TranslationService.translate('common.label.undefined_value');
      }

      var symbol = TranslationService.translate('common.label.unit.currency');
      if (isOriginal) {
        var numberSplitted = amount.toString().split('.');
        var numberOfDecimal = numberSplitted[1] ? numberSplitted[1].length : 0;
        return $filter('currency')(amount, symbol, numberOfDecimal);
      }

      amount = Math.floor(amount);
      return $filter('currency')(amount, symbol);
    };
  }
}());
