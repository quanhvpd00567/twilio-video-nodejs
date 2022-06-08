(function () {
  'use strict';

  angular
    .module('orders.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.orders1', {
        abstract: true,
        url: '/orders',
        template: '<ui-view/>'
      })
      .state('admin.orders.list', {
        url: '',
        templateUrl: '/modules/orders/client/views/admin/orders-list.client.view.html',
        controller: 'AdminOrderListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin'],
          pageTitle: '注文一覧'
        }
      });
  }
}());
