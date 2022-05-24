(function () {
  'use strict';

  angular
    .module('municipalities-guest.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipalities-guest', {
        abstract: true,
        url: '/municipality',
        template: '<ui-view/>'
      })
      .state('municipalities-guest.create', {
        url: '/register',
        templateUrl: '/modules/municipalities/client/views/guest/municipality-form.client.view.html',
        controller: 'MunicipalityGuestFormController',
        controllerAs: 'vm',
        resolve: {
          munic: newMunic
        },
        data: {
          pageTitle: '自治体アカウント発行'
        }
      });

    newMunic.$inject = ['MunicipalitiesService'];
    function newMunic(MunicipalitiesService) {
      return new MunicipalitiesService();
    }
  }
}());
