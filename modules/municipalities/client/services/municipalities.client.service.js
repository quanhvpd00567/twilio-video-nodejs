(function () {
  'use strict';

  angular
    .module('municipalities.admin.services')
    .factory('MunicipalitiesService', MunicipalitiesService)
    .factory('MunicipalitiesApi', MunicipalitiesApi);

  MunicipalitiesService.$inject = ['$resource'];
  function MunicipalitiesService($resource) {
    var resource = $resource('/api/municipalities/:municId', { municId: '@_id' }, {
      update: { method: 'PUT' }
    });

    angular.extend(resource.prototype, {
      createOrUpdate: function () {
        var munic = this;
        return createOrUpdate(munic);
      }
    });

    return resource;

    function createOrUpdate(munic) {
      if (munic._id) {
        return munic.$update(onSuccess, onError);
      } else {
        return munic.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(event) { }

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

  MunicipalitiesApi.$inject = ['$http'];
  function MunicipalitiesApi($http) {
    // Get list municipality
    this.list = function (conditions) {
      return $http.get('/api/municipalities/', { params: conditions });
    };

    this.getAll = function () {
      return $http.get('/api/municipalities/all', {});
    };

    // Get info municipality
    this.info = function () {
      return $http.get('/api/municipalities/info');
    };

    this.updateByMunic = function (data) {
      return $http.post('/api/municipalities/update-munic', data);
    };

    return this;
  }
}());
