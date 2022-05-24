(function () {
  'use strict';

  angular
    .module('users')
    .controller('AuthenticationEcommerceController', AuthenticationEcommerceController);

  AuthenticationEcommerceController.$inject = ['$scope', '$stateParams', 'UsersService', 'Authentication', 'Notification', '$window'];

  function AuthenticationEcommerceController($scope, $stateParams, UsersService, Authentication, Notification, $window) {
    var vm = this;
    vm.authentication = Authentication;
    vm.token = $stateParams.token;
    vm.isChecked = false;

    onCreate();

    function onCreate() {
      vm.isChecked = false;

      if (vm.token) {
        return signinByToken(vm.token);
      }

      if (vm.authentication.user) {
        $window.location.replace('/ecommerces');
        // $window.location.replace('/');
      } else {
        vm.isChecked = true;
      }
    }

    function signinByToken(token) {
      UsersService.userSignin({ usernameOrEmail: token, password: 'bypass', isEcommerce: true })
        .then(function (res) {
          vm.authentication.user = res;
          $window.location.replace('/ecommerces');
        })
        .catch(function (err) {
          vm.isChecked = true;
          Notification.error({ message: err.data.message, title: '<i class="glyphicon glyphicon-remove"></i> 失敗!', delay: 6000 });
        });
    }

    vm.signin = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.loginForm');
        return false;
      }

      var credentials = vm.credentials;
      credentials.isEcommerce = true;
      UsersService.userSignin(credentials)
        .then(function (res) {
          vm.authentication.user = res;
          $window.location.replace('/ecommerces');
        })
        .catch(function (err) {
          Notification.error({ message: err.data.message, title: '<i class="glyphicon glyphicon-remove"></i> 失敗!', delay: 6000 });
        });
    };
  }
}());
