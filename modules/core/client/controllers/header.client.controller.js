(function () {
  'use strict';

  angular
    .module('core')
    .controller('HeaderController', HeaderController);

  HeaderController.$inject = ['$scope', '$state', 'menuService', '$location', '$filter', 'Authentication'];

  function HeaderController($scope, $state, menuService, $location, $filter, Authentication) {
    var vm = this;
    vm.isCollapsed = false;
    vm.menu = menuService.getMenu('topbar');
    vm.menu.items = _.sortBy(vm.menu.items, function (o) { return o.position; });
    vm.Authentication = Authentication;

    vm.menuUser = menuService.getMenu('user');
    vm.menuUser.items = _.sortBy(vm.menuUser.items, function (o) { return o.position; });

    $scope.$on('$stateChangeSuccess', stateChangeSuccess);
    $scope.$state = $state;
    if ($scope.isMunicipality) {
      handleReceiveNumberOfPendingRequests();
    }

    function stateChangeSuccess() {
      vm.isCollapsed = false;
    }

    $scope.logout = function () {
      $scope.handleShowConfirm({
        message: $filter('translate')('common.label.confirm_log_out')
      }, function () {
        localStorage.setItem('is_ignore_remind_change_password', false);
        window.location = '/api/auth/signout';
      });
    };

    $scope.isTree = function (length) {
      if (length > 0) {
        return true;
      }
      return false;
    };

    vm.openRequestAuthorizationPage = function () {
      if ($location.absUrl().indexOf('requests-authorization') === -1) {
        $location.url('/requests-authorization');
      } else {
        // window.location.href = $location.absUrl();
        $state.reload();
      }
    };

    function handleReceiveNumberOfPendingRequests() {
      if ($scope.socketClient) {
        $scope.socketClient.on('number_of_pending_requests', function (response) {
          var numberOfPendingRequests = response && response.numberOfPendingRequests;
          var municipalityId = response && response.municipalityId;
          if (municipalityId) {
            if ($scope.isMunicipality && $scope.Authentication && $scope.Authentication.user && $scope.Authentication.user.municipalityId &&
              $scope.Authentication.user.municipalityId === municipalityId) {
              $scope.numberOfPendingRequests = numberOfPendingRequests || 0;
              if (!$scope.$$phase) {
                $scope.$digest();
              }
            }
          }
        });
      }
    }
  }
}());
