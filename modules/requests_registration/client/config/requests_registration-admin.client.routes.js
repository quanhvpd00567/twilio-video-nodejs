(function () {
  'use strict';

  angular
    .module('requests_registration.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.requests_registration', {
        abstract: true,
        url: '/requests-registration',
        template: '<ui-view/>'
      })
      .state('admin.requests_registration.list', {
        url: '',
        templateUrl: '/modules/requests_registration/client/views/admin/requests_registration-list.client.view.html',
        controller: 'RequestRegisterAdminListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: '代理登録'
        }
      });
  }
}());
