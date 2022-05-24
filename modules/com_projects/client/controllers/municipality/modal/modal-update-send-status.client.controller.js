(function () {
  'use strict';
  angular
    .module('events.company')
    .controller('ModalUpdateSendStatusController', ModalUpdateSendStatusController);

  ModalUpdateSendStatusController.$inject = ['$scope', '$filter', 'sendStatus'];
  function ModalUpdateSendStatusController($scope, $filter, sendStatus) {
    var vm = this;
    vm.sendStatus = sendStatus;

    onCreate();

    function onCreate() {
    }

    vm.save = function () {
      $scope.handleShowConfirm({
        message: $filter('translate')('event.detail.controller.message.confirm_update_comproject')
      }, function () {
        $scope.confirm(vm.sendStatus);
      });
    };

    vm.closeThisDialog = function () {
      $scope.confirm(null);
    };
  }
}());
