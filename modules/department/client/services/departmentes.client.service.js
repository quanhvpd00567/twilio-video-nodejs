(function () {
  'use strict';

  angular
    .module('departments.company.services')
    .factory('DepartmentService', DepartmentService)
    .factory('DepartmentApi', DepartmentApi);

  DepartmentService.$inject = ['$resource'];
  function DepartmentService($resource) {
    var resource = $resource('/api/departments/:departmentId', { departmentId: '@_id' }, {
      update: { method: 'PUT' },
      send: { method: 'PATCH' }
    });

    angular.extend(resource.prototype, {
      createOrUpdate: function () {
        var department = this;
        return createOrUpdate(department);
      }
    });

    return resource;

    function createOrUpdate(department) {
      if (department._id) {
        return department.$update(onSuccess, onError);
      } else {
        return department.$save(onSuccess, onError);
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

  DepartmentApi.$inject = ['$http'];
  function DepartmentApi($http) {
    // Get list company
    this.list = function (conditions) {
      return $http.get('/api/departments', { params: conditions });
    };

    this.paging = function (conditions) {
      return $http.get('/api/departments/paging', { params: conditions });
    };

    this.getAllByCompany = function (data) {
      return $http.get('/api/departments/all-company', { params: data });
    };

    // this.getNumber = function (name) {
    //   return $http.get('/api/get-compamy-number', { params: { name: name } });
    // };

    // this.info = function (companyId) {
    //   return $http.get('/api/company/info', { params: { companyId: companyId } });
    // };
    return this;
  }
}());
