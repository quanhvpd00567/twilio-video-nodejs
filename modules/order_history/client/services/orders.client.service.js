(function () {
  'use strict';

  angular
    .module('orders.admin.services')
    .factory('OrderHistoryApi', OrderHistoryApi);

  OrderHistoryApi.$inject = ['$http'];
  function OrderHistoryApi($http) {
    // Get list employee belong to company
    this.history = function (params) {
      return $http.get('/api/orders/history', { params: params });
    };
    this.historyByMunic = function (municId) {
      return $http.get('/api/orders/history/' + municId);
    };
    this.filterCountByMunic = function (municId, byMonth) {
      return $http.get('/api/orders/history/' + municId + '/count/' + byMonth);
    };
    this.filterPriceByMunic = function (municId, byMonth) {
      return $http.get('/api/orders/history/' + municId + '/price/' + byMonth);
    };


    return this;
  }
}());
