(function () {
  'use strict';

  angular
    .module('ecommerces.company.services')
    .factory('CartsApi', CartsApi);

  CartsApi.$inject = ['$http'];
  function CartsApi($http) {
    this.addOrUpdateCart = function (cart) {
      return $http.post('/api/ecommerces/cart/add-or-update', { cart: cart });
    };

    this.getCartsPending = function () {
      return $http.get('/api/ecommerces/carts/pending');
    };

    this.removeProductFromCart = function (productId, cartId) {
      return $http.post('/api/ecommerces/cart/remove-product', { productId: productId, cartId: cartId });
    };

    this.saveCartInfo = function (cartId, cart) {
      return $http.put('/api/ecommerces/cart/' + cartId, { cart: cart });
    };

    return this;
  }
}());
