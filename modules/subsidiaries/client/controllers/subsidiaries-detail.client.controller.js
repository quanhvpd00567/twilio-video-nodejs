(function () {
  'use strict';

  angular
    .module('employees.admin')
    .controller('SubsidiaryDetailController', SubsidiaryDetailController);

  SubsidiaryDetailController.$inject = ['$scope', 'subsidiary', '$stateParams', 'CompanyApi', '$filter'];

  function SubsidiaryDetailController($scope, subsidiary, $stateParams, CompanyApi, $filter) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.subsidiary = subsidiary;
  }
}());
