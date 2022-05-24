(function () {
  'use strict';

  angular
    .module('requests_application.municipality.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.requests_application', {
        abstract: true,
        url: '/requests-application',
        template: '<ui-view/>'
      })
      .state('municipality.requests_application.list', {
        url: '',
        templateUrl: '/modules/requests_application/client/views/requests-application-list.client.view.html',
        controller: 'RequestsApplicationListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: '申請トレイ'
        }
      });
  }
}());
