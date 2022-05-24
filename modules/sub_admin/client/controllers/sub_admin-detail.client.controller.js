(function () {
  'use strict';

  angular
    .module('sub_admins.admin')
    .controller('SubAdminDetailController', SubAdminDetailController);

  SubAdminDetailController.$inject = ['$scope', 'subAdminResolve'];

  function SubAdminDetailController($scope, subAdmin) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.subAdmin = subAdmin;
  }
}());
