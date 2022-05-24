(function () {
  'use strict';

  angular
    .module('municipalities.admin')
    .controller('MunicipalityAdminProductSettingController', MunicipalityAdminProductSettingController);

  MunicipalityAdminProductSettingController.$inject = ['$scope', '$stateParams', '$state', '$filter', 'MunicipalitiesApi', 'RequestRegistrationApi', 'RequestsApplicationApi'];

  function MunicipalityAdminProductSettingController($scope, $stateParams, $state, $filter, MunicipalitiesApi, RequestRegistrationApi, RequestsApplicationApi) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.munic = [];
    vm.auth = $scope.Authentication.user;
    vm.classX = '';
    vm.isKey13 = false;
    vm.isKey14 = false;
    vm.requestItemId = $stateParams.requestItemId;
    vm.requestStatus = $stateParams.requestStatus;
    vm.apply_need = [
      { id: 2, text: '受付中' },
      { id: 1, text: '受付停止' }
    ];

    onCreate();

    function init() {
      vm.municipalityId = $state.params.municipalityId;
      vm.isNeedAuthorize = $state.params.isNeedAuthorize;
      vm.key = $state.params.key;

      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && (!vm.municipalityId || !vm.key || !['update_tax_payment_13', 'update_tax_payment_14'].includes(vm.key))) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }

      if (vm.municipalityId) {
        // RequestRegistrationApi.checkPermissionRequest({ municipalityId: vm.municipalityId })
        //   .success(function (res) {
        //     vm.featureAuthor = res;
        //     var features_authorized = vm.featureAuthor.features_authorized;
        //     features_authorized.filter(function (item) {
        //       if (item.feature === 'update_tax_payment_13' && vm.key === 'update_tax_payment_13') {
        //         vm.isKey13 = true;
        //       }
        //       if (item.feature === 'update_tax_payment_14' && vm.key === 'update_tax_payment_14') {
        //         vm.isKey14 = true;
        //       }

        //       return true;
        //     });
        //   });
        if (vm.key === 'update_tax_payment_13') {
          vm.isKey13 = true;
        }
        if (vm.key === 'update_tax_payment_14') {
          vm.isKey14 = true;
        }
      } else {
        vm.isKey13 = true;
        vm.isKey14 = true;
      }
    }

    function onCreate() {
      init();

      MunicipalitiesApi.info(vm.municipalityId).success(function (res) {
        vm.munic = res;
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

        if (vm.munic.is_setting_gift_bows === undefined) {
          vm.munic.is_setting_gift_bows = true;
        }

        if (vm.munic.is_setting_docs === undefined) {
          vm.munic.is_setting_docs = true;
        }

        if (vm.munic.is_apply_need === undefined) {
          vm.munic.is_apply_need = 2;
        }

        if (vm.requestItemId) {
          $scope.handleShowWaiting();
          RequestsApplicationApi.get(vm.requestItemId)
            .success(function (res) {
              $scope.handleCloseWaiting();
              Object.assign(vm.munic, res.data);
            })
            .error(function (error) {
              $scope.handleCloseWaiting();
              $scope.handleShowToast($scope.parseErrorMessage(error), true);
            });
        }

        if (vm.munic.is_usage_system === undefined) {
          vm.munic.is_usage_system = 2;
        }
      }).error(function (error) {

      });
    }


    // handle update question
    vm.updateProductSetting = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.municFormProductSetting');
        return false;
      }

      var data = {
        question: vm.munic.question,
        is_apply_times: vm.munic.is_apply_times,
        is_setting_docs: vm.munic.is_setting_docs,
        is_setting_gift_bows: vm.munic.is_setting_gift_bows,
        max_quantity: vm.munic.max_quantity,
        checklist: vm.munic.checklist,
        contact_name: vm.munic.contact_name,
        contact_tel: vm.munic.contact_tel,
        contact_mail: vm.munic.contact_mail,
        fax: vm.munic.fax,
        is_apply_need: vm.munic.is_apply_need,
        is_usage_system: vm.munic.is_usage_system
      };

      if (vm.municipalityId && vm.key) {
        data.municipalityId = vm.municipalityId;
        data.key = vm.key;
      }

      if (vm.requestItemId) {
        data.requestItemId = vm.requestItemId;
      }

      var messageConfirm = $filter('translate')('municipalities.settings.form.controller.message.product_confirm_save');

      if (vm.municipalityId && vm.key === 'update_tax_payment_14' && vm.isNeedAuthorize === 'false') {
        messageConfirm = $filter('translate')('municipalities.settings.form.controller.message.product_confirm_save2');
      }

      if (vm.municipalityId && vm.key && vm.isNeedAuthorize === 'true') {
        messageConfirm = $filter('translate')('request_item.server.message.confirm_register');
      }

      $scope.handleShowConfirm({
        message: messageConfirm
      }, function () {
        MunicipalitiesApi.updateMunic(data)
          .success(successCallback)
          .error(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          var message = $filter('translate')('municipalities.settings.form.controller.message.product_save_success');

          if (vm.municipalityId && vm.key === 'update_tax_payment_14' && vm.isNeedAuthorize === 'false') {
            message = $filter('translate')('municipalities.settings.form.controller.message.product_save_success2');
          }

          if (vm.municipalityId && vm.key && vm.isNeedAuthorize === 'true') {
            message = $filter('translate')('request_item.server.message.save_success');
          }
          $scope.handleShowToast(message);
          if (vm.municipalityId && vm.key) {
            $state.go('admin.requests_registration.list');
          }
        }

        function errorCallback(error) {
          $scope.handleCloseWaiting();
          $scope.handleShowToast($scope.parseErrorMessage(error, $filter('translate')('municipalities.settings.form.controller.message.save_failed')), true);
        }
      });
    };
  }
}());
