(function () {
  'use strict';

  angular
    .module('requests_authorization.municipality.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.requests_authorization', {
        abstract: true,
        url: '/requests-authorization',
        template: '<ui-view/>'
      })
      .state('municipality.requests_authorization.list', {
        url: '',
        templateUrl: '/modules/requests_authorization/client/views/requests-authorization-list.client.view.html',
        controller: 'RequestsAuthorizationListController',
        controllerAs: 'vm',
        data: {
          roles: ['munic_admin', 'munic_member'],
          pageTitle: '承認トレイ'
        }
      });
  }
}());
