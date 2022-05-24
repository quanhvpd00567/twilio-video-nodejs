(function () {
  'use strict';

  angular
    .module('core')
    .controller('HeaderEcommerceController', HeaderEcommerceController);

  HeaderEcommerceController.$inject = ['$scope', '$state', 'menuService', '$location', '$filter', 'Authentication'];

  function HeaderEcommerceController($scope, $state, menuService, $location, $filter, Authentication) {
    var vm = this;

    $scope.logout = function () {
      $scope.handleShowConfirm({
        message: $filter('translate')('common.label.confirm_log_out')
      }, function () {
        window.location = '/api/auth/signout-ecommerce';
      });
    };
  }
}());
