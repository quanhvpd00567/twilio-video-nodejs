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
        url: '/setting',
        template: '<ui-view/>'
      })
      .state('municipality.munic.munic_setting', {
        url: '',
        templateUrl: '/modules/municipalities/client/views/municipality/municipality-form.client.view.html',
        controller: 'MunicipalityMunicFormController',
        controllerAs: 'vm',
        // resolve: {
        //   municipality: getDetail
        // },
        data: {
          roles: ['municipality'],
          pageTitle: '自治体情報管理'
        }
      });
  }
}());
