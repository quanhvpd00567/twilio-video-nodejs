(function () {
  'use strict';

  angular
    .module('features_authorization.company.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('company.features_authorization', {
        abstract: true,
        url: '/features-authorization/company',
        template: '<ui-view/>'
      })
      .state('company.features_authorization.edit', {
        url: '',
        templateUrl: '/modules/features_authorization/client/views/company/features-authorization-company-form.client.view.html',
        controller: 'FeaturesAuthorizationFormCompanyController',
        controllerAs: 'vm',
        data: {
          roles: ['company'],
          pageTitle: '企業情報代理登録'
        }
      });
  }
}());
