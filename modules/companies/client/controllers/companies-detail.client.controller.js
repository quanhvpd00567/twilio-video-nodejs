(function () {
  'use strict';

  angular
    .module('companies.admin')
    .controller('CompanyDetailController', CompanyDetailController);

  CompanyDetailController.$inject = ['$scope', 'companyResolve'];

  function CompanyDetailController($scope, company) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.company = company;
  }
}());
