(function () {
  'use strict';

  angular
    .module('municipalities.admin')
    .controller('MunicipalityAdminDetailController', MunicipalityAdminDetailController);

  MunicipalityAdminDetailController.$inject = ['$scope', 'municipality', '$stateParams', 'MunicipalitiesApi', '$filter'];

  function MunicipalityAdminDetailController($scope, municipality, $stateParams, MunicipalitiesApi, $filter) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.municipality = municipality;
    vm.isAdminAndSubAdmin = ['admin', 'sub_admin'].includes($scope.Authentication.user.roles[0]);
  }
}());
