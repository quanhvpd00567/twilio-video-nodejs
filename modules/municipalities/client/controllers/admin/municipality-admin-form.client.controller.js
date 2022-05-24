(function () {
  'use strict';

  angular
    .module('municipalities.admin')
    .controller('MunicipalityAdminFormController', MunicipalityAdminFormController);

  MunicipalityAdminFormController.$inject = ['$scope', '$state', '$stateParams', '$filter', 'MunicipalitiesApi', 'RequestsApplicationApi', 'RequestRegistrationApi'];

  function MunicipalityAdminFormController($scope, $state, $stateParams, $filter, MunicipalitiesApi, RequestsApplicationApi, RequestRegistrationApi) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.requestStatus = $stateParams.requestStatus;
    vm.munic = [];
    vm.classX = '';
    vm.isRequiredNumberBank = false;
    vm.bank_tranfer_id = vm.master.payment_methods[2].id;
    vm.auth = $scope.Authentication.user;
    vm.requestItemId = $stateParams.requestItemId;

    init();

    function init() {
      vm.municipalityId = $state.params.municipalityId;
      vm.isNeedAuthorize = $state.params.isNeedAuthorize;
      vm.key = $state.params.key;

      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && !vm.municipalityId && !vm.key) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }
    }

    onCreate();

    // Toggle selection for a given fruit by name
    $scope.toggleSelection = function toggleSelection(id) {
      var idx = vm.munic.methods.indexOf(id);
      if (idx > -1) {
        vm.munic.methods.splice(idx, 1);
      } else {
        vm.munic.methods.push(id);
      }

      if (vm.munic.methods.includes(vm.bank_tranfer_id)) {
        vm.isRequiredNumberBank = true;
      } else {
        vm.isRequiredNumberBank = false;
      }

      if (vm.munic.methods.length > 0) {
        vm.municForm.methods.$setValidity('required', true);
      } else {
        vm.municForm.methods.$setValidity('required', false);
      }
    };

    function onCreate() {
      MunicipalitiesApi.info(vm.municipalityId).success(function (res) {
        vm.munic = res;

        var init = function () {
          if (vm.munic.methods.length === 0) {
            // vm.munic.methods = [1];
          } else {
            if (vm.munic.methods.includes(vm.bank_tranfer_id)) {
              vm.isRequiredNumberBank = true;
            }
          }
          if (!vm.munic.bank_type) {
            vm.munic.bank_type = 1;
          }
        };

        if (vm.requestItemId) {
          $scope.handleShowWaiting();
          RequestsApplicationApi.get(vm.requestItemId)
            .success(function (res) {
              $scope.handleCloseWaiting();
              Object.assign(vm.munic, res.data);
              init();
            })
            .error(function (error) {
              $scope.handleCloseWaiting();
              $scope.handleShowToast($scope.parseErrorMessage(error), true);
            });
        } else {
          init();
        }
      }).error(function (error) {

      });
    }

    // Handle update munic
    vm.update = function (isValid) {
      vm.error_method = false;
      if (!isValid) {
        vm.classX = '';
        if (vm.munic.methods.length === 0) {
          vm.municForm.methods.$setValidity('required', false);
        } else {
          vm.municForm.methods.$setValidity('required', true);
        }

        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.municForm');

        return false;
      }

      if (vm.isKey15) {
        if (vm.munic.methods.length === 0) {
          vm.municForm.methods.$setValidity('required', false);
          $scope.$broadcast('show-errors-check-validity', 'vm.municForm');
          vm.isSaveClick = true;
          return false;
        } else {
          vm.municForm.methods.$setValidity('required', true);
        }
      }

      var messageConfirm = $filter('translate')('municipalities.settings.form.controller.message.confirm_save');
      if (vm.municipalityId && vm.key && vm.isNeedAuthorize === 'true') {
        messageConfirm = $filter('translate')('request_item.server.message.confirm_register');
      }
      $scope.handleShowConfirm({
        message: messageConfirm
      }, function () {
        if (vm.municipalityId && vm.key) {
          vm.munic.municipalityId = vm.municipalityId;
          vm.munic.key = vm.key;
        }
        if (vm.requestItemId) {
          vm.munic.requestItemId = vm.requestItemId;
        }

        MunicipalitiesApi.updateInfo(vm.munic)
          .success(successCallback)
          .error(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          var message = $filter('translate')('municipalities.settings.form.controller.message.save_success');
          if (vm.municipalityId && vm.key && vm.isNeedAuthorize === 'true') {
            message = $filter('translate')('request_item.server.message.save_success');
          }
          $scope.handleShowToast(message);
          if (vm.requestItemId) {
            $state.go('municipality.requests_application.list');
          } else {
            var path = '/settings';
            if (vm.municipalityId && vm.key) {
              $state.go('admin.requests_registration.list');
            } else {
              setTimeout(function () {
                window.location.href = path;
              }, 500);
            }
          }
        }

        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error && error.message || $filter('translate')('municipalities.settings.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
    };
  }
}());
