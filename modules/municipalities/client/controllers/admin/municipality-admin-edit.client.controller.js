(function () {
  'use strict';

  angular
    .module('municipalities.admin')
    .controller('MunicipalityAdminEditController', MunicipalityAdminEditController);

  MunicipalityAdminEditController.$inject = ['$scope', '$state', 'municipality', '$filter', 'MunicipalitiesApi', 'MunicipalitiesService'];

  function MunicipalityAdminEditController($scope, $state, municipality, $filter, MunicipalitiesApi, MunicipalitiesService) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.munic = municipality;
    vm.isAdminAndSubAdmin = ['admin', 'sub_admin'].includes($scope.Authentication.user.roles[0]);

    // Toggle selection for a given fruit by name
    $scope.toggleSelection = function toggleSelection(id) {
      var idx = vm.munic.methods.indexOf(id);
      if (idx > -1) {
        vm.munic.methods.splice(idx, 1);
      } else {
        vm.munic.methods.push(id);
      }

      if (vm.munic.methods.length === 0) {
        vm.error_method = true;
      } else {
        vm.error_method = false;
      }
    };

    // Handle update company
    vm.update = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.municForm');

        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('municipalities.settings.form.controller.message.confirm_save')
      }, function () {

        vm.munic.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          $state.go('admin.municipalities.list');

          var message = $filter('translate')('municipalities.settings.form.controller.message.save_success');
          $scope.handleShowToast(message);
        }

        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('municipalities.settings.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
    };
  }
}());
