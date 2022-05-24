(function () {
  'use strict';
  angular.module('core').filter('parse_donation_amount', parseDonationAmount);

  parseDonationAmount.$inject = ['TranslationService', '$filter'];
  function parseDonationAmount(TranslationService, $filter) {
    return function (amount, status, FINISHED_STATUS, type, donation_amount) {
      // incase show donation_amount for fixed event
      if (type && type === 'fixed' && donation_amount) {
        donation_amount = Math.floor(donation_amount);
        return $filter('number')(donation_amount) + TranslationService.translate('common.label.unit.money');
      }

      if (status !== FINISHED_STATUS) {
        return TranslationService.translate('event.list.table.body.donation_amount.unset');
      }

      amount = Math.floor(amount);
      return $filter('number')(amount) + TranslationService.translate('common.label.unit.money');
    };
  }
}());
