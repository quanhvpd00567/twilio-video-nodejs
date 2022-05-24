(function () {
  'use strict';

  angular
    .module('pointHistories.admin.services')
    .factory('PointHistoriesApi', PointHistoriesApi);

  PointHistoriesApi.$inject = ['$http'];
  function PointHistoriesApi($http) {
    this.getCurrentPoints = function (condition) {
      return $http.post('/api/point-histories/current', { condition: condition }, {});
    };

    this.getUsedPoints = function (year, month) {
      return $http.get('/api/point-histories/used', { params: { year: year, month: month } }, {});
    };

    this.getExpiredPoints = function (year) {
      return $http.get('/api/point-histories/expired', { params: { year: year } }, {});
    };

    this.updatePaymentStatus = function (paymentHistoryId, isPaid) {
      return $http.post('/api/point-histories/' + paymentHistoryId + '/update-payment-status', { isPaid: isPaid }, {});
    };

    return this;
  }
}());
