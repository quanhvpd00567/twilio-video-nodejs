(function () {
  'use strict';
  angular
    .module('events.company')
    .controller('ModalUpdatePayStatusController', ModalUpdatePayStatusController);

  ModalUpdatePayStatusController.$inject = ['$scope', '$filter', 'payStatus'];
  function ModalUpdatePayStatusController($scope, $filter, payStatus) {
    var vm = this;
    vm.payStatus = payStatus;

    onCreate();

    function onCreate() {
    }

    vm.save = function () {
      $scope.handleShowConfirm({
        message: $filter('translate')('event.detail.controller.message.confirm_update_comproject')
      }, function () {
        $scope.confirm(vm.payStatus);
      });
    };

    vm.closeThisDialog = function () {
      $scope.confirm(null);
    };
  }
}());
