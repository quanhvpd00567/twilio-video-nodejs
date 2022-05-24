(function () {
  'use strict';

  angular
    .module('subsidiaries.admin.services')
    .factory('SubsidiaryService', SubsidiaryService)
    .factory('SubsidiaryApi', SubsidiaryApi);

  SubsidiaryService.$inject = ['$resource'];
  function SubsidiaryService($resource) {
    var resource = $resource('/api/subsidiaries/:subsidiaryId', { subsidiaryId: '@_id' }, {
      update: { method: 'PUT' }
    });

    angular.extend(resource.prototype, {
      createOrUpdate: function () {
        var subsidiary = this;
        return createOrUpdate(subsidiary);
      }
    });

    return resource;

    function createOrUpdate(subsidiary) {
      if (subsidiary._id) {
        return subsidiary.$update({ companyId: subsidiary.companyId }, onSuccess, onError);
      } else {
        return subsidiary.$save(onSuccess, onError);
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

  SubsidiaryApi.$inject = ['$http'];
  function SubsidiaryApi($http) {
    // Get list subsidiaries belong to company
    this.list = function (conditions) {
      return $http.get('/api/subsidiaries', { params: conditions });
    };

    // Get company of employee
    this.company = function () {
      return $http.get('/api/current-company');
    };

    this.delete = function ($id, $companyId) {
      return $http.delete('/api/subsidiaries/' + $id + '?companyId=' + $companyId);
    };

    this.getAllByCompany = function (params) {
      return $http.get('/api/subsidiaries/all', { params: params });
    };

    this.getNumber = function (name) {
      return $http.get('/api/get-compamy-number', { params: { name: name } });
    };

    return this;
  }
}());
