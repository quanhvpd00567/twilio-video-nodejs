(function () {
  'use strict';
  angular
    .module('events.company')
    .controller('ModalUpdatePaymentStatusController', ModalUpdatePaymentStatusController);

  ModalUpdatePaymentStatusController.$inject = ['$scope', '$filter', 'isPaid'];
  function ModalUpdatePaymentStatusController($scope, $filter, isPaid) {
    var vm = this;
    vm.isPaid = isPaid;
    console.log(vm.isPaid);

    onCreate();

    function onCreate() {
    }

    vm.save = function () {
      $scope.handleShowConfirm({
        message: $filter('translate')('point_history.modal.update_payment_status.controller.message.confirm_update_payment_status')
      }, function () {
        $scope.confirm(vm.isPaid);
      });
    };

    vm.closeThisDialog = function () {
      $scope.confirm(null);
    };
  }
}());
