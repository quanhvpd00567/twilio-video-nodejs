(function () {
  'use strict';

  angular
    .module('employees.admin.services')
    .factory('EmployeeService', EmployeeService)
    .factory('EmployeeApi', EmployeeApi);

  EmployeeService.$inject = ['$resource'];
  function EmployeeService($resource) {
    var resource = $resource('/api/employees/:employeeId', { employeeId: '@_id' }, {
      update: { method: 'PUT' }
    });

    angular.extend(resource.prototype, {
      createOrUpdate: function () {
        var employee = this;
        return createOrUpdate(employee);
      }
    });

    return resource;

    function createOrUpdate(employee) {
      if (employee._id) {
        return employee.$update({ companyId: employee.companyId }, onSuccess, onError);
      } else {
        return employee.$save(onSuccess, onError);
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

  EmployeeApi.$inject = ['$http'];
  function EmployeeApi($http) {
    // Get list employee belong to company
    this.list = function (conditions) {
      return $http.get('/api/employees', { params: conditions });
    };

    // Get list subsidiaries belong to company
    this.subsidiaries = function (conditions) {
      return $http.get('/api/subsidiaries', { params: conditions });
    };

    // Get list subsidiaries belong to company
    this.removeMulti = function (ids) {
      return $http.post('/api/employees/remove-multi', { ids: ids });
    };

    // Get list subsidiaries belong to company
    this.export = function (conditions) {
      return $http.get('/api/employees/export', { params: conditions });
    };
    this.qrCode = function (conditions) {
      return $http.get('/api/employees/create-qrcode', { params: conditions });
    };

    this.getInfoCompany = function (info) {
      return $http.post('/api/employees/info-company', { info: info }, {});
    };

    this.isOnlyOneCompanyAccount = function (userId) {
      return $http.post('/api/employees/only-one-company-account', { userId: userId });
    };

    this.guestCreate = function (data) {
      return $http.post('/api/employees/guest-create', data, {});
    };

    return this;
  }
}());
