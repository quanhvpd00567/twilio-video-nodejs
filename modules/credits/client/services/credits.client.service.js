(function () {
  'use strict';

  angular
    .module('credits.admin.services')
    .factory('CreditsApi', CreditsApi);

  CreditsApi.$inject = ['$http'];
  function CreditsApi($http) {
    this.gentoken_veritrans = function (data) {
      return $http.post('https://api.veritrans.co.jp/4gtoken', data, {});
    };
    this.credit_token = function () {
      return $http.post('/api/credits/token', {}, {});
    };
    this.credit_add = function (data) {
      return $http.post('/api/credits/add', data, {});
    };
    this.credit_pay = function (cardId, amount, orderId) {
      return $http.post('/api/credits/pay', { orderId: orderId, cardId: cardId, amount: amount }, {});
    };
    this.credit_delete = function (cardId) {
      return $http.post('/api/credits/delete', { cardId: cardId }, {});
    };
    this.credit_info = function (data) {
      return $http.post('/api/credits/info', data, {});
    };
    return this;
  }

}());
