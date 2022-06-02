(function () {
  'use strict';

  angular
    .module('orders.municipality.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.orders', {
        abstract: true,
        url: '/orders',
        template: '<ui-view/>'
      })
      .state('municipality.orders.list', {
        url: '',
        templateUrl: '/modules/orders/client/views/orders-list.client.view.html',
        controller: 'OrderListController',
        controllerAs: 'vm',
        data: {
          roles: ['municipality'],
          pageTitle: '注文一覧'
        }
      });
  }
}());
