(function () {
  'use strict';

  angular
    .module('locations.admin.services')
    .factory('LocationsService', LocationsService)
    .factory('LocationsApi', LocationsApi);

  LocationsService.$inject = ['$resource'];

  function LocationsService($resource) {
    var Location = $resource('/api/locations/:locationId', { locationId: '@_id' }, {
      update: { method: 'PUT' },
      send: { method: 'PATCH' }
    });

    angular.extend(Location.prototype, {
      createOrUpdate: function () {
        var location = this;
        return createOrUpdate(location);
      }
    });

    return Location;

    function createOrUpdate(location) {
      if (location._id) {
        return location.$update(onSuccess, onError);
      } else {
        return location.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(location) { }

      // Handle error response
      function onError(errorResponse) {
        var error = errorResponse.data;
        handleError(error);
      }
    }
    function handleError(error) {
      return false;
    }
  }

  LocationsApi.$inject = ['$http'];
  function LocationsApi($http) {
    this.list = function (condition) {
      return $http.post('/api/locations/paging', { condition: condition }, {});
    };

    this.detail = function (locationId) {
      return $http.get('/api/locations/' + locationId + '/detail');
    };

    return this;
  }
}());
