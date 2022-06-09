(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$scope', '$state', 'Authentication', '$filter'];
  function HomeController($scope, $state, Authentication, $filter) {
    if (Authentication.user) {
      var is_ignore_remind_change_password = localStorage.getItem('is_ignore_remind_change_password');
      is_ignore_remind_change_password = JSON.parse(is_ignore_remind_change_password);
      if (Authentication.user.is_required_update_password && !is_ignore_remind_change_password) {
        setTimeout(function () {
          $scope.handleShowConfirm({
            message: '初期パスワードを変更する必要があります。',
            btnOk: $filter('translate')('common.button.ok'),
            closeByDocument: 1
          }, function () {
            localStorage.setItem('is_ignore_remind_change_password', true);
            $state.go('settings');
          }, function () {
            localStorage.setItem('is_ignore_remind_change_password', true);
            $scope.handleLoggedIn(Authentication.user);
          });
        }, 0);
      } else {
        $scope.handleBackToHome(Authentication.user);
      }
    } else {
      $state.go('member.signin');
    }
  }
}());
