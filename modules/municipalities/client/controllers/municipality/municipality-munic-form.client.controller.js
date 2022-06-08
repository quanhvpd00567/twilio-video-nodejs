(function () {
  'use strict';

  angular
    .module('municipalities.munic')
    .controller('MunicipalityMunicFormController', MunicipalityMunicFormController);

  MunicipalityMunicFormController.$inject = ['$scope', '$filter', 'MunicipalitiesApi'];

  function MunicipalityMunicFormController($scope, $filter, MunicipalitiesApi) {
    var vm = this;
    vm.datesOfStartMonth = [];
    vm.datesOfEndMonth = [];
    onCreate();

    function onCreate() {
      MunicipalitiesApi.info()
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.munic = res;
          if (vm.munic.suspension_period && vm.munic.suspension_period === $scope.masterdata.SUSPENSION_PERIOD.RESERVE) {
            vm.handleGenerateStartDatesOfMonth();
            vm.handleGenerateEndDatesOfMonth();
          }
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
      if (vm.munic.is_apply_need === $scope.masterdata.APPLY_NEED.ACCEPTING) {
        vm.munic.suspension_period = null;
      }
      if (!vm.munic.suspension_period || vm.munic.suspension_period === $scope.masterdata.SUSPENSION_PERIOD.SOON) {
        vm.munic.start_month = null;
        vm.munic.start_date = null;
        vm.munic.end_month = null;
        vm.munic.end_date = null;
      }

      if (vm.munic.start_month && vm.munic.start_date && vm.munic.end_month && vm.munic.end_date) {
        var year = new Date().getFullYear();
        if (new Date(vm.munic.end_date + '/' + vm.munic.end_month + '/' + year) <= new Date(vm.munic.start_date + '/' + vm.munic.start_month + '/' + year)) {
          var message = $filter('translate')('municipalities.form.end_date.error.less_start_date');
          $scope.handleShowToast(message, true);
          return;
        }
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

    vm.handleGenerateStartDatesOfMonth = function () {
      vm.datesOfStartMonth = [];
      for (var i = 1; i <= daysInMonth(vm.munic.start_month); i++) {
        vm.datesOfStartMonth.push(i);
      }
      vm.munic.start_date = vm.datesOfStartMonth[0];
    };

    vm.handleGenerateEndDatesOfMonth = function () {
      vm.datesOfEndMonth = [];
      for (var i = 1; i <= daysInMonth(vm.munic.end_month); i++) {
        vm.datesOfEndMonth.push(i);
      }
      vm.munic.end_date = vm.datesOfEndMonth[0];
    };

    function daysInMonth(month) {
      return new Date(new Date().getFullYear(), month, 0).getDate();
    }
  }
}());
