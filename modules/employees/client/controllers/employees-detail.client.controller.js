(function () {
  'use strict';

  angular
    .module('employees.admin')
    .controller('EmployeeDetailController', EmployeeDetailController);

  EmployeeDetailController.$inject = ['$scope', 'employee', '$stateParams', 'CompanyApi', '$filter'];

  function EmployeeDetailController($scope, employee, $stateParams, CompanyApi, $filter) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.employee = employee;
    // if (vm.employee.subsidiary && vm.employee.subsidiary.isHQ === true) {
    //   vm.employee.subsidiary.name = $filter('translate')('companies.detail.name.default.label');
    // }
  }
}());
