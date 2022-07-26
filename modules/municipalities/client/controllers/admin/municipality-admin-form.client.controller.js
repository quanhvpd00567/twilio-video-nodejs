﻿(function () {
  'use strict';

  angular
    .module('municipalities.admin')
    .controller('MunicipalityAdminFormController', MunicipalityAdminFormController);

  MunicipalityAdminFormController.$inject = ['$scope', '$state', 'municipality', '$filter'];

  function MunicipalityAdminFormController($scope, $state, municipality, $filter) {
    var vm = this;
    vm.munic = municipality;

    onCreate();

    function onCreate() {
    }

    // Handle update municipality
    vm.createOrUpdate = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.municForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('municipalities.form.controller.message.confirm_save'),
        btnClose: $filter('translate')('common.button.existModal'),
        btnOk: $filter('translate')('common.button.ok')
      }, function () {

        vm.munic.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          vm.isSaveClick = false;
          $scope.$broadcast('show-errors-reset');
          var message = $filter('translate')('municipalities.form.controller.message.save_success');
          $scope.handleShowToast(message);

          $state.go('admin.municipalities.list');
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('municipalities.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
    };
  }
}());
