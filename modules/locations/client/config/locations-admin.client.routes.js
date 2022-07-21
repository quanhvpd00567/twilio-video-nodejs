(function () {
  'use strict';

  angular
    .module('locations.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.locations', {
        abstract: true,
        url: '/zoomus',
        template: '<ui-view/>'
      })
      .state('admin.locations.demo', {
        url: '',
        templateUrl: '/modules/locations/client/views/admin/location-list.client.view.html',
        controller: 'LocationListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin'],
          pageTitle: 'zoomus'
        }
      });

    getLocation.$inject = ['$stateParams', 'LocationsService'];
    function getLocation($stateParams, LocationsService) {
      return LocationsService.get({
        locationId: $stateParams.locationId
      }).$promise;
    }

    newLocation.$inject = ['LocationsService'];
    function newLocation(LocationsService) {
      return new LocationsService();
    }
  }
}());
