(function () {
  'use strict';

  angular
    .module('core.company.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('company', {
        abstract: true,
        url: '',
        template: '<ui-view/>',
        data: {
          roles: ['company']
        }
      })
      .state('company.home', {
        url: '/home',
        templateUrl: '/modules/core/client/views/home-company.client.view.html',
        controller: 'HomeCompanyController',
        controllerAs: 'vm',
        data: {
          roles: ['company'],
          pageTitle: 'ホーム'
        }
      });
  }
}());
