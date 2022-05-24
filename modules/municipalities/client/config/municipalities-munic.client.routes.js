(function () {
  'use strict';

  angular
    .module('municipalities.munic.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.munic', {
        abstract: true,
        url: '',
        template: '<ui-view/>'
      })
      // .state('municipality.munic.product-config', {
      //   url: '/product-config',
      //   templateUrl: '/modules/municipalities/client/views/admin/municipality-product-setting.client.view.html',
      //   controller: 'MunicipalityAdminProductSettingController',
      //   controllerAs: 'vm',
      //   data: {
      //     roles: ['munic_admin'],
      //     pageTitle: 'ふるさと納税に関する設定'
      //   }
      // })
      .state('municipality.munic.settings', {
        url: '/settings?{municipalityId, key, requestStatus, requestItemId, isNeedAuthorize}',
        templateUrl: '/modules/municipalities/client/views/admin/municipality-form.client.view.html',
        controller: 'MunicipalityAdminFormController',
        controllerAs: 'vm',
        data: {
          roles: ['munic_admin', 'admin', 'sub_admin'],
          pageTitle: '自治体情報の編集'
        }
      });
  }
}());
