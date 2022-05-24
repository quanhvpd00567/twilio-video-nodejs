(function () {
  'use strict';

  angular
    .module('ecommerces.company.services')
    .factory('EcommercesApi', EcommercesApi);

  EcommercesApi.$inject = ['$http'];
  function EcommercesApi($http) {
    this.getProducts = function (condition) {
      return $http.post('/api/ecommerces/products/paging', { condition: condition });
    };

    this.getProductDetail = function (productId) {
      return $http.get('/api/ecommerces/products/' + productId);
    };

    this.getUsingMunic = function (municId) {
      return $http.get('/api/munic/' + municId + '/using');
    };

    this.getAddressByZipcode = function (zipcode) {
      return $http.get('/api/address/' + zipcode);
    };

    this.getMunicInfo = function (municid) {
      return $http.get('/api/ecommerces/munic/' + municid);
    };

    this.getCart = function (municId) {
      return $http.get('/api/ecommerces/cart/' + municId);
    };

    this.getListCard = function () {
      return $http.get('/api/users/cards');
    };

    this.addCard = function (data) {
      return $http.post('/api/ecommerces/cards', data);
    };

    this.getOrders = function (condition) {
      return $http.post('/api/ecommerces/orders/paging', { condition: condition });
    };

    this.getOrderDetail = function (orderId) {
      return $http.get('/api/ecommerces/orders/' + orderId);
    };

    this.submitOrder = function (data) {
      return $http.post('/api/ecommerces/order', data);
    };

    this.get3LatestNotices = function () {
      return $http.get('/api/ecommerces/notices/3-latest');
    };
    this.pagingNotices = function (condition) {
      return $http.post('/api/ecommerces/notices/paging', { condition: condition });
    };
    this.getNoticeById = function (noticeId) {
      return $http.get('/api/ecommerces/notices/' + noticeId);
    };

    this.checkMappingMunic = function (municId, prefecture, city) {
      return $http.get('/api/ecommerces/check-mapping-munic/' + municId, { params: { prefecture: prefecture, city: city } });
    };

    this.getMunicipalitiesHasActivePoints = function () {
      return $http.get('/api/ecommerces/municipalities-has-active-points');
    };

    this.removeCard = function (card_id) {
      return $http.post('/api/ecommerces/remove-card', { card_id: card_id });
    };

    this.getUsingById = function (municId, usingId) {
      return $http.get('/api/ecommerces/' + municId + '/using/' + usingId);
    };

    this.getCardInfo = function (cardId) {
      return $http.get('/api/ecommerces/card/' + cardId);
    };

    this.getOrderLatest = function () {
      return $http.get('/api/ecommerces/order-lastest');
    };

    return this;
  }
}());
