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
        url: '/locations',
        template: '<ui-view/>'
      })
      .state('admin.locations.list', {
        url: '',
        templateUrl: '/modules/locations/client/views/admin/location-list.client.view.html',
        controller: 'LocationListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin'],
          pageTitle: '導入施設一覧'
        }
      })
      .state('admin.locations.create', {
        url: '/create',
        templateUrl: '/modules/locations/client/views/admin/location-form.client.view.html',
        controller: 'LocationFormController',
        controllerAs: 'vm',
        resolve: {
          locationResolve: newLocation
        },
        data: {
          roles: ['admin'],
          pageTitle: '導入施設登録'
        }
      })
      .state('admin.locations.edit', {
        url: '/:locationId/edit',
        templateUrl: '/modules/locations/client/views/admin/location-form.client.view.html',
        controller: 'LocationFormController',
        controllerAs: 'vm',
        resolve: {
          locationResolve: getLocation
        },
        data: {
          roles: ['admin'],
          pageTitle: '導入施設編集'
        }
      })
      .state('admin.locations.detail', {
        url: '/:locationId/detail',
        templateUrl: '/modules/locations/client/views/admin/location-detail.client.view.html',
        controller: 'LocationDetailController',
        controllerAs: 'vm',
        resolve: {
          locationResolve: getLocation
        },
        data: {
          roles: ['admin'],
          pageTitle: '導入施設詳細'
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
