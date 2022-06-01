(function () {
  'use strict';

  angular
    .module('products.admin.services')
    .factory('ProductService', ProductService)
    .factory('ProductApi', ProductApi);

  ProductService.$inject = ['$resource'];
  function ProductService($resource) {
    var resource = $resource('/api/products/:productId', { productId: '@_id' }, {
      update: { method: 'PUT' }
    });

    angular.extend(resource.prototype, {
      createOrUpdate: function () {
        var member = this;
        return createOrUpdate(member);
      }
    });

    return resource;

    function createOrUpdate(member) {
      if (member._id) {
        return member.$update(onSuccess, onError);
      } else {
        return member.$save(onSuccess, onError);
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

  ProductApi.$inject = ['$http'];
  function ProductApi($http) {
    // Get list employee belong to company
    this.list = function (conditions) {
      return $http.get('/api/products', { params: conditions });
    };
    this.create = function (data) {
      return $http.post('/api/products/', data, {});
    };
    this.update = function (id, data) {
      return $http.put('/api/products/' + id, data, {});
    };

    // Get list subsidiaries belong to company
    this.subsidiaries = function (conditions) {
      return $http.get('/api/subsidiaries', { params: conditions });
    };

    // Get list subsidiaries belong to company
    this.removeMulti = function (ids) {
      return $http.post('/api/munic-members/remove-multi', { ids: ids });
    };

    this.getMunicipality = function (municipalityId) {
      return $http.get('/api/municipality', { params: { municipalityId: municipalityId } });
    };
    this.getMunicipalityAll = function () {
      return $http.get('/api/municipalities-all');
    };
    this.getLocationByMunic = function (municId) {
      return $http.get('/api/location-by-munic', { params: { municId: municId } });
    };

    return this;
  }
}());
