(function () {
  'use strict';

  angular
    .module('locations.admin')
    .controller('LocationFormController', LocationFormController);

  LocationFormController.$inject = ['$scope', '$state', 'locationResolve', '$filter', 'MunicipalitiesApi'];

  function LocationFormController($scope, $state, location, $filter, MunicipalitiesApi) {
    var vm = this;
    vm.location = location;
    vm.municipalities = [];
    vm.update = update;

    onCreate();

    function onCreate() {
      getAllMunicipalities();

      if (vm.location && vm.location.municipality && vm.location.municipality._id) {
        vm.location.municipality = vm.location.municipality._id;
      }
    }

    function getAllMunicipalities() {
      MunicipalitiesApi.getAll()
        .success(function (res) {
          vm.municipalities = res || [];
        })
        .error(function (error) {
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    function update(isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.locationForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('locations.form.controller.message.confirm_save')
      }, function () {
        $scope.handleShowWaiting();
        vm.location.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          $state.go('admin.locations.detail', { locationId: res && res._id });
          var message = $filter('translate')('locations.form.controller.message.save_success');
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('locations.form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        }
      });
    }
  }
}());
