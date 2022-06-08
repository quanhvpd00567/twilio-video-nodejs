(function () {
  'use strict';

  angular
    .module('locations.munic.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.locations', {
        abstract: true,
        url: '/locations',
        template: '<ui-view/>'
      })
      .state('municipality.locations.list', {
        url: '',
        templateUrl: '/modules/locations/client/views/municipality/location-list.client.view.html',
        controller: 'LocationMunicipalityListController',
        controllerAs: 'vm',
        data: {
          roles: ['municipality'],
          pageTitle: '導入施設一覧'
        }
      })
      .state('municipality.locations.detail', {
        url: '/:locationId/detail',
        templateUrl: '/modules/locations/client/views/municipality/location-detail.client.view.html',
        controller: 'LocationMunicipalityDetailController',
        controllerAs: 'vm',
        resolve: {
          locationResolve: getLocation
        },
        data: {
          roles: ['municipality'],
          pageTitle: '導入施設詳細'
        }
      });

    getLocation.$inject = ['$stateParams', 'LocationsService'];
    function getLocation($stateParams, LocationsService) {
      return LocationsService.get({
        locationId: $stateParams.locationId
      }).$promise;
    }
  }
}());
