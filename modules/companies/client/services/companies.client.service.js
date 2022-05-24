(function () {
  'use strict';

  angular
    .module('companies.admin.services')
    .factory('CompanyService', CompanyService)
    .factory('CompanyApi', CompanyApi);

  CompanyService.$inject = ['$resource'];
  function CompanyService($resource) {
    var resource = $resource('/api/companies/:companyId', { companyId: '@_id' }, {
      update: { method: 'PUT' },
      send: { method: 'PATCH' }
    });

    angular.extend(resource.prototype, {
      createOrUpdate: function () {
        var company = this;
        return createOrUpdate(company);
      }
    });

    return resource;

    function createOrUpdate(company) {
      if (company._id) {
        return company.$update(onSuccess, onError);
      } else {
        return company.$save(onSuccess, onError);
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

  CompanyApi.$inject = ['$http'];
  function CompanyApi($http) {
    // Get list company
    this.list = function (conditions) {
      return $http.get('/api/companies/', { params: conditions });
    };

    this.getAll = function () {
      return $http.get('/api/companies/all');
    };

    this.getNumber = function (name) {
      return $http.get('/api/get-compamy-number', { params: { name: name } });
    };

    this.info = function (companyId) {
      return $http.get('/api/company/info', { params: { companyId: companyId } });
    };
    return this;
  }
}());
