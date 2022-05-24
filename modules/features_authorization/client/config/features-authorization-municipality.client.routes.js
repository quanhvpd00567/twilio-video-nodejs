(function () {
  'use strict';

  angular
    .module('features_authorization.municipality.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.features_authorization', {
        abstract: true,
        url: '/features-authorization/municipality',
        template: '<ui-view/>'
      })
      .state('municipality.features_authorization.edit', {
        url: '',
        templateUrl: '/modules/features_authorization/client/views/municipality/features-authorization-municipality-form.client.view.html',
        controller: 'FeaturesAuthorizationFormMunicipalityController',
        controllerAs: 'vm',
        data: {
          roles: ['munic_admin', 'munic_member'],
          pageTitle: '自治体情報代理登録'
        }
      });
  }
}());
