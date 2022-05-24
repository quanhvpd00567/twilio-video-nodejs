(function () {
  'use strict';

  angular
    .module('users')
    .controller('AuthenticationController', AuthenticationController);

  AuthenticationController.$inject = ['$scope', 'UsersService', 'Authentication', 'Notification', '$window'];

  function AuthenticationController($scope, UsersService, Authentication, Notification, $window) {
    var vm = this;
    vm.authentication = Authentication;

    if (vm.authentication.user) {
      $window.location.replace('/');
    }

    vm.signin = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.loginForm');
        return false;
      }

      UsersService.userSignin(vm.credentials)
        .then(function (res) {
          vm.authentication.user = res;
          $window.location.replace('/');
        })
        .catch(function (err) {
          Notification.error({ message: err.data.message, title: '<i class="glyphicon glyphicon-remove"></i> 失敗!', delay: 6000 });
        });
    };

    vm.openCompanyRegistrationPage = function () {
      window.location.href = '/company/register';
    };

    vm.openMunicipalityRegistrationPage = function () {
      window.location.href = '/municipality/register';
    };
  }
}());
