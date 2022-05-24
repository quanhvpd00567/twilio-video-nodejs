(function () {
  'use strict';

  angular
    .module('users')
    .controller('EcommerceResetPasswordController', EcommerceResetPasswordController);

  EcommerceResetPasswordController.$inject = ['$scope', 'UsersService', '$state', '$filter'];

  function EcommerceResetPasswordController($scope, UsersService, $state, $filter) {
    var vm = this;
    vm.reset = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.loginForm');
        return false;
      }

      vm.busy = true;
      UsersService.resetPasswordEcommerce(vm.user.email)
        .then(function (_res) {
          vm.busy = false;
          var message = $filter('translate')('reset_password.form.controller.message.reset_success');
          $scope.handleShowToast(message);
          $state.go('ecommerce.sent_mail');
        })
        .catch(function (err) {
          vm.busy = false;
          var message = (err && err.message) || (err && err.data && err.data.message) || $filter('translate')('reset_password.form.controller.message.reset_failed');
          $scope.handleShowToast(message, true);
          return false;
        });
    };
  }
}());
