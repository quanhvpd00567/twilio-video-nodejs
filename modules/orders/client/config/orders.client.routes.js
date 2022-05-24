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
          roles: ['munic_admin', 'munic_member'],
          pageTitle: '注文一覧'
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
