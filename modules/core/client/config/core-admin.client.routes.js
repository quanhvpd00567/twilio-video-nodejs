(function () {
  'use strict';

  angular
    .module('core.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin', {
        abstract: true,
        url: '/admin',
        template: '<ui-view/>',
        data: {
          roles: ['admin', 'sub_admin']
        }
      })
      .state('municipality', {
        abstract: true,
        url: '',
        template: '<ui-view/>',
        data: {
          roles: ['munic_admin']
        }
      })
      .state('ktc', {
        url: '/ktc',
        templateUrl: '/modules/core/client/views/tools.client.view.html',
        controller: 'ToolController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Tool'
        }
      })
      .state('admin.home', {
        url: '',
        templateUrl: '/modules/core/client/views/home.client.view.html',
        controller: 'HomeController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: 'ホーム'
        }
      });
  }
}());
