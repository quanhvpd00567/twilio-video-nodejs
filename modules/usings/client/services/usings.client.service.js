(function () {
  'use strict';

  angular
    .module('usings.municipality.services')
    .factory('UsingsService', UsingsService)
    .factory('UsingsApi', UsingsApi);

  UsingsService.$inject = ['$resource'];

  function UsingsService($resource) {
    var Using = $resource('/api/usings/:usingId', { usingId: '@_id' }, {
      update: { method: 'PUT' },
      send: { method: 'PATCH' }
    });

    angular.extend(Using.prototype, {
      createOrUpdate: function () {
        var using = this;
        return createOrUpdate(using);
      }
    });

    return Using;

    function createOrUpdate(using) {
      if (using._id) {
        return using.$update(onSuccess, onError);
      } else {
        return using.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(using) { }

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

  UsingsApi.$inject = ['$http'];
  function UsingsApi($http) {
    this.list = function (condition) {
      return $http.post('/api/usings/paging', { condition: condition }, {});
    };
    this.create = function (data) {
      return $http.post('/api/usings/', data, {});
    };
    this.update = function (id, data) {
      return $http.put('/api/usings/' + id, data, {});
    };

    return this;
  }
}());
