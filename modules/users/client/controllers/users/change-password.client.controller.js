(function () {
  'use strict';

  angular
    .module('users')
    .controller('ChangePasswordController', ChangePasswordController);

  ChangePasswordController.$inject = ['$scope', 'UsersService', '$filter'];

  function ChangePasswordController($scope, UsersService, $filter) {
    var vm = this;
    vm.isSaveClick = false;

    vm.onChangeNewPassword = function () {
      if (vm.passwordDetails.verifyPassword) {
        var isSamePassword = vm.passwordDetails.newPassword === vm.passwordDetails.verifyPassword;
        vm.passwordForm.verifyPassword.$setValidity('passwordVerify', isSamePassword);
      }
    };

    vm.handleChangePassword = function (isValid) {
      vm.isSaveClick = true;
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.passwordForm');
        return false;
      }

      UsersService.changePassword(vm.passwordDetails)
        .then(function (response) {
          vm.isSaveClick = false;
          $scope.handleShowToast($filter('translate')('change_password.form.controller.message.change_pass_success'));
          vm.passwordDetails = null;
        })
        .catch(function (response) {
          $scope.handleShowToast(response.data.message, true);
        });
    };
  }
}());
