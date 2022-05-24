(function () {
  'use strict';

  angular
    .module('companies.admin')
    .controller('DepartmentDetailCompanyController', DepartmentDetailCompanyController);

  DepartmentDetailCompanyController.$inject = ['$scope', 'departmentResolve'];

  function DepartmentDetailCompanyController($scope, department) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.department = department;
  }
}());
