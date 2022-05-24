(function () {
  'use strict';

  angular
    .module('municipalities.munic.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.munic_product_config', {
        abstract: true,
        url: '',
        template: '<ui-view/>'
      })
      .state('municipality.munic_product_config.product-config', {
        url: '/product-config?{municipalityId, requestItemId, key, requestStatus, isNeedAuthorize}',
        templateUrl: '/modules/municipalities/client/views/admin/municipality-product-setting.client.view.html',
        controller: 'MunicipalityAdminProductSettingController',
        controllerAs: 'vm',
        data: {
          roles: ['munic_admin', 'admin', 'sub_admin'],
          pageTitle: 'ふるさと納税に関する設定'
        }
      });
  }
}());
