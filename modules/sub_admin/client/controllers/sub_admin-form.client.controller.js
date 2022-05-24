(function () {
  'use strict';

  angular
    .module('sub_admins.admin')
    .controller('SubAdminFormController', SubAdminFormController);

  SubAdminFormController.$inject = ['$scope', '$state', 'subAdminResolve', '$stateParams', '$filter', 'SubsidiaryApi'];

  function SubAdminFormController($scope, $state, sub_admin, $stateParams, $filter, SubsidiaryApi) {
    var vm = this;
    vm.sub_admin = sub_admin;
    vm.master = $scope.masterdata;

    onCreate();

    function onCreate() {
    }

    // Handle update company
    vm.createOrUpdate = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.subAdminForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('sub_admins.form.controller.message.confirm_save'),
        btnClose: $filter('translate')('common.button.existModal'),
        btnOk: $filter('translate')('common.button.ok')
      }, function () {
        $scope.handleShowWaiting();

        vm.sub_admin.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          vm.isSaveClick = false;
          $scope.handleCloseWaiting();
          var message = $filter('translate')('sub_admins.form.controller.message.save_success');
          $scope.$broadcast('show-errors-reset');
          $scope.handleShowToast(message);
          $state.go('admin.sub_admins.list');
        }

        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('companies.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
    };


    function getAllByCompany() {
      SubsidiaryApi.getAllByCompany({})
        .success(function (res) {
          vm.subsidiaries = res;
          if (!vm.department._id && vm.subsidiaries) {
            vm.department.subsidiary = vm.subsidiaries[0]._id;
          } else {
            vm.department.subsidiary = vm.department.subsidiary._id;
          }
          $scope.handleCloseWaiting();
        }).error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.message || $filter('translate')('companies.form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        });
    }
  }
}());
