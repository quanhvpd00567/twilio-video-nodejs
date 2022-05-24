(function () {
  'use strict';

  angular
    .module('pointHistories.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.pointHistories', {
        abstract: true,
        url: '/point-histories',
        template: '<ui-view/>'
      })
      .state('admin.pointHistories.list', {
        url: '',
        templateUrl: '/modules/point_histories/client/views/point-history-list.client.view.html',
        controller: 'PointHistoryListController',
        controllerAs: 'vm',
        data: {
          roles: ['sub_admin'],
          pageTitle: 'ポイント付与履歴'
        }
      });
  }
}());
