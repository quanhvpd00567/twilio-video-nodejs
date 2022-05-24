(function () {
  'use strict';

  angular
    .module('munic_members.municipality')
    .controller('MunicMembersDetailController', MunicMembersDetailController);

  MunicMembersDetailController.$inject = ['$scope', '$state', 'member', '$stateParams', 'CompanyApi', '$filter', 'RequestsApplicationApi'];

  function MunicMembersDetailController($scope, $state, member, $stateParams, CompanyApi, $filter, RequestsApplicationApi) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.requestItemId = $stateParams.requestItemId;
    vm.member = member;

    if (!vm.member._id) {
      $state.go('municipality.munic_members.list');
    }

    if ($scope.isAdminOrSubAdmin) {
      vm.municipalityId = $stateParams.municipalityId;
      vm.isNeedAuthorize = $stateParams.isNeedAuthorize;
      vm.key = $stateParams.key;
    }

    if (vm.requestItemId) {
      $scope.handleShowWaiting();
      RequestsApplicationApi.get(vm.requestItemId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          Object.assign(vm.member, res.data);
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
    }
  }
}());
