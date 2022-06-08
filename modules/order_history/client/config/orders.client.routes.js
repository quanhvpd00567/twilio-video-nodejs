(function () {
  'use strict';

  angular
    .module('orders.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.orders', {
        abstract: true,
        url: '/orders',
        template: '<ui-view/>'
      })
      .state('admin.orders.history', {
        url: '/history',
        templateUrl: '/modules/order_history/client/views/orders-history.client.view.html',
        controller: 'OrderHistoryController',
        controllerAs: 'vm',
        data: {
          roles: ['admin'],
          pageTitle: '寄付履歴'
        }
      });


    // getDetail.$inject = ['$stateParams', 'MunicMemberService'];
    // function getDetail($stateParams, MunicMemberService) {
    //   return MunicMemberService.get({
    //     memberId: $stateParams.memberId
    //   }).$promise;
    // }

    // newMember.$inject = ['MunicMemberService'];
    // function newMember(MunicMemberService) {
    //   return new MunicMemberService();
    // }
  }
}());
