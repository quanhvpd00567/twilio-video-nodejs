(function () {
  'use strict';

  angular
    .module('orders.municipality.services')
    .factory('OrderApi', OrderApi);

  OrderApi.$inject = ['$http'];
  function OrderApi($http) {
    // Get list employee belong to company
    this.list = function (conditions) {
      return $http.get('/api/orders', { params: conditions });
    };

    this.export = function (conditions) {
      return $http.get('/api/orders/export', { params: conditions });
    };

    this.checkOrderExported = function (conditions) {
      return $http.get('/api/orders/check-export', { params: conditions });
    };

    this.adminExport = function (conditions) {
      return $http.get('/api/orders/admin-export', { params: conditions });
    };
    this.adminList = function (conditions) {
      return $http.get('/api/orders/admin-list', { params: conditions });
    };

    this.adminExportExcel = function () {
      return $http.get('/api/orders/excport-excel');
    };

    return this;
  }
}());
