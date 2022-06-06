(function () {
  'use strict';

  angular
    .module('municipalities.munic')
    .controller('MunicipalityMunicFormController', MunicipalityMunicFormController);

  MunicipalityMunicFormController.$inject = ['$scope', '$filter', 'MunicipalitiesApi'];

  function MunicipalityMunicFormController($scope, $filter, MunicipalitiesApi) {
    var vm = this;
    onCreate();

    function onCreate() {
      MunicipalitiesApi.info()
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.munic = res;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
    }

    // Handle update municipality
    vm.update = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.municForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('municipalities_munic.form.controller.message.confirm_save'),
        btnClose: $filter('translate')('common.button.existModal'),
        btnOk: $filter('translate')('common.button.ok')
      }, function () {
        MunicipalitiesApi.updateByMunic(vm.munic)
          .success(successCallback)
          .error(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          vm.isSaveClick = false;
          $scope.$broadcast('show-errors-reset');
          var message = $filter('translate')('municipalities_munic.form.controller.message.save_success');
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('municipalities_munic.form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        }
      });
    };
  }
}());
