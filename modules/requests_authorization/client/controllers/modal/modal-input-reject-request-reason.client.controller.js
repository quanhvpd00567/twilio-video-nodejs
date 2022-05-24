(function () {
  'use strict';
  angular
    .module('events.company')
    .controller('ModalInputRejectRequestReasonController', ModalInputRejectRequestReasonController);

  ModalInputRejectRequestReasonController.$inject = ['$scope', '$filter'];
  function ModalInputRejectRequestReasonController($scope, $filter) {
    var vm = this;
    vm.rejectReason = '';

    onCreate();
    function onCreate() {
    }

    vm.save = function () {
      if (!vm.rejectReason) {
        return;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('request_authorization.list.controller.message.confirm_reject')
      }, function () {
        $scope.confirm(vm.rejectReason);
      });
    };

    vm.closeThisDialog = function () {
      $scope.confirm(null);
    };
  }
}());
