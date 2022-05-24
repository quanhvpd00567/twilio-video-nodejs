(function () {
  'use strict';

  angular
    .module('sub_admins.admin.services')
    .factory('SubAdminService', SubAdminService)
    .factory('SubAdminApi', SubAdminApi);

  SubAdminService.$inject = ['$resource'];
  function SubAdminService($resource) {
    var resource = $resource('/api/sub-admins/:subAdminId', { subAdminId: '@_id' }, {
      update: { method: 'PUT' }
    });

    angular.extend(resource.prototype, {
      createOrUpdate: function () {
        var subAdmin = this;
        return createOrUpdate(subAdmin);
      }
    });

    return resource;

    function createOrUpdate(subAdmin) {
      if (subAdmin._id) {
        return subAdmin.$update(onSuccess, onError);
      } else {
        return subAdmin.$save(onSuccess, onError);
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

  SubAdminApi.$inject = ['$http'];
  function SubAdminApi($http) {
    this.list = function (conditions) {
      return $http.get('/api/sub-admins', { params: conditions });
    };


    return this;
  }
}());
