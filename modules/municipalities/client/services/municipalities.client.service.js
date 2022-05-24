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
    this.info = function (municipalityId) {
      return $http.get('/api/municipalities/info', { params: { municipalityId: municipalityId } });
    };

    this.updateInfo = function (munic) {
      return $http.post('/api/municipalities/update-info', munic);
    };

    this.isUpdatedPaymentMethod = function (municipalityId) {
      return $http.post('/api/municipalities/check-update-payment-method', { municipalityId: municipalityId });
    };

    this.getListMunicipalitiesHasProjectsInPeriod = function (condition) {
      return $http.get('/api/municipalities/list-has-project-in-period', { params: condition });
    };

    this.updateMunic = function (data) {
      return $http.post('/api/municipalities/update-munic', data);
    };

    this.getMunicipalityContactInfo = function (municipalityId) {
      return $http.get('/api/municipalities/' + municipalityId + '/contact-info');
    };

    return this;
  }
}());
