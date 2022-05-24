(function () {
  'use strict';

  angular
    .module('settings.admin')
    .controller('SettingFormController', SettingFormController);

  SettingFormController.$inject = ['$scope', '$state', 'settingsApi', '$filter', '$window'];

  function SettingFormController($scope, $state, settingsApi, $filter, $window) {
    var vm = this;
    var validator = $window.validator;
    vm.update = update;
    vm.dateOptions = { showWeeks: false, minDate: new Date(new Date().setHours(0, 0, 0, 0)) };
    vm.settingCloned;

    var CONFIG_SET_TYPE = {
      PPS: 'pps',
      APS: 'aps'
    };
    var ITEM_PER_PAGE = 5;
    vm.isAddOrEditingPPS = false;
    vm.configSettingPPS = {};
    vm.configSettingAPS = {};
    onCreate();

    function onCreate(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      prepareConditionForPPS(true);
      prepareConditionForAPS(true);

      settingsApi.get()
        .success(function (data) {
          $scope.handleCloseWaiting();
          vm.setting = data;
          vm.setting.isSetMinimumDonationAmount = Boolean(data.minimum_donation_amount_apply_future_value);
          vm.setting.isSetAps = Boolean(data.aps_apply_future_value);
          vm.settingCloned = JSON.parse(JSON.stringify(vm.setting));

          if (vm.setting.pps_apply_start_date) {
            vm.setting.pps_apply_start_date = new Date(vm.setting.pps_apply_start_date);
          }
          if (vm.setting.donation_amount_apply_start_date) {
            vm.setting.donation_amount_apply_start_date = new Date(vm.setting.donation_amount_apply_start_date);
          }

          handleSearchForPPS(true);
          handleSearchForAPS(true);
        })
        .error(function (err) {
          $scope.handleCloseWaiting();
          var message = (err) ? err.message || err.data.message : $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    // pps
    function prepareConditionForPPS(clear) {
      vm.conditionForPPS = $scope.prepareCondition('pps_setting', clear);
      vm.conditionForPPS.sort_column = 'pps_apply_start_date';
      vm.conditionForPPS.sort_direction = '-';
      vm.conditionForPPS.limit = ITEM_PER_PAGE;
    }

    function handleSearchForPPS(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      settingsApi.listPPSSetting(vm.conditionForPPS)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.ppsDocs = res.docs;
          vm.conditionForPPS.count = res.docs.length;
          vm.conditionForPPS.page = res.page;
          vm.conditionForPPS.total = res.totalDocs;
          $scope.conditionFactoryUpdate('pps_setting', vm.conditionForPPS);
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    vm.handlePageChangedForPPS = function () {
      handleSearchForPPS();
    };

    vm.addOrUpdatePPS = function () {
      // validator
      if (vm.configSettingPPS.pps && vm.configSettingPPS.pps < $scope.masterdata.MINIMUM_PPS) {
        var message2 = $filter('translate')('setting.form.pps_apply_future_value.error.min');
        message2 = message2.replace('{0}', $scope.masterdata.MINIMUM_PPS);
        $scope.handleShowToast(message2, true);
        return;
      }

      var patternFloat = /^[\d.]+$/;
      if (!validator.matches(vm.configSettingPPS.pps + '', patternFloat)) {
        var message1 = $filter('translate')('setting.form.pps_apply_future_value.error.number');
        $scope.handleShowToast(message1, true);
        return;
      }

      $scope.handleShowConfirm({
        message: 'この付与ポイントを保存します。よろしいですか？'
      }, function () {
        vm.configSettingPPS.type = CONFIG_SET_TYPE.PPS;
        $scope.handleShowWaiting();
        settingsApi.addOrUpdateConfigSet(vm.configSettingPPS)
          .success(function (data) {
            $scope.handleShowToast('付与ポイントの保存が完了しました。');
            vm.configSettingPPS = {};
            vm.isAddOrEditingPPS = false;
            onCreate(true);
          })
          .error(function (res) {
            $scope.handleCloseWaiting();
            var message = (res) ? res.message || res.data.message : $filter('translate')('setting.form.controller.message.save_failed');
            $scope.handleShowToast(message, true);
          });
      });
    };

    vm.editPPS = function (item) {
      vm.configSettingPPS = JSON.parse(JSON.stringify(item));
      vm.configSettingPPS.pps_apply_start_date = new Date(vm.configSettingPPS.pps_apply_start_date);
      vm.isAddOrEditingPPS = true;
    };

    vm.removePPS = function (itemId) {
      $scope.handleShowConfirm({
        message: 'この付与ポイントを削除します。よろしいですか？'
      }, function () {
        $scope.handleShowWaiting();
        settingsApi.deleteConfigSet(itemId)
          .success(function (data) {
            $scope.handleShowToast('付与ポイントの削除が完了しました。');
            handleSearchForPPS(true);
          })
          .error(function (res) {
            $scope.handleCloseWaiting();
            var message = (res) ? res.message || res.data.message : $filter('translate')('setting.form.controller.message.save_failed');
            $scope.handleShowToast(message, true);
          });
      });
    };
    // End pps

    // aps
    function prepareConditionForAPS(clear) {
      vm.conditionForAPS = $scope.prepareCondition('aps_setting', clear);
      vm.conditionForAPS.sort_column = 'donation_amount_apply_start_date';
      vm.conditionForAPS.sort_direction = '-';
      vm.conditionForAPS.limit = ITEM_PER_PAGE;
    }

    function handleSearchForAPS(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      settingsApi.listAPSSetting(vm.conditionForAPS)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.apsDocs = res.docs;
          vm.conditionForAPS.count = res.docs.length;
          vm.conditionForAPS.page = res.page;
          vm.conditionForAPS.total = res.totalDocs;
          $scope.conditionFactoryUpdate('aps_setting', vm.conditionForAPS);
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    vm.isDisableSaveAPS = function () {
      return (vm.configSettingAPS.isSetMinimumDonationAmount && !vm.configSettingAPS.minimum_donation_amount && vm.configSettingAPS.minimum_donation_amount !== 0)
        || (vm.configSettingAPS.isSetAps && !vm.configSettingAPS.aps && vm.configSettingAPS.aps !== 0)
        || !vm.configSettingAPS.donation_amount_apply_start_date;
    };

    vm.handlePageChangedForAPS = function () {
      handleSearchForAPS();
    };

    vm.addOrUpdateAPS = function () {
      if (vm.configSettingAPS.isSetAps) {
        // validator
        if (vm.configSettingAPS.aps && vm.configSettingAPS.aps < $scope.masterdata.MINIMUM_APS) {
          var message2 = $filter('translate')('setting.form.aps_apply_future_value.error.min');
          message2 = message2.replace('{0}', $scope.masterdata.MINIMUM_APS);
          $scope.handleShowToast(message2, true);
          return;
        }

        var patternFloat = /^[\d.]+$/;
        if (!validator.matches(vm.configSettingAPS.aps + '', patternFloat)) {
          var message1 = $filter('translate')('setting.form.aps_apply_future_value.error.number');
          $scope.handleShowToast(message1, true);
          return;
        }
      }

      $scope.handleShowConfirm({
        message: 'この寄付金額を保存します。よろしいですか？'
      }, function () {
        vm.configSettingAPS.type = CONFIG_SET_TYPE.APS;
        if (!vm.configSettingAPS.isSetMinimumDonationAmount) {
          vm.configSettingAPS.minimum_donation_amount = null;
        }
        if (!vm.configSettingAPS.isSetAps) {
          vm.configSettingAPS.aps = null;
        }
        $scope.handleShowWaiting();
        settingsApi.addOrUpdateConfigSet(vm.configSettingAPS)
          .success(function (data) {
            $scope.handleShowToast('寄付金額の保存が完了しました。');
            vm.configSettingAPS = {};
            vm.isAddOrEditingAPS = false;
            onCreate(true);
          })
          .error(function (res) {
            $scope.handleCloseWaiting();
            var message = (res) ? res.message || res.data.message : $filter('translate')('setting.form.controller.message.save_failed');
            $scope.handleShowToast(message, true);
          });
      });
    };

    vm.editAPS = function (item) {
      vm.configSettingAPS = JSON.parse(JSON.stringify(item));
      vm.configSettingAPS.isSetMinimumDonationAmount = Boolean(vm.configSettingAPS.minimum_donation_amount);
      vm.configSettingAPS.isSetAps = Boolean(vm.configSettingAPS.aps);
      vm.configSettingAPS.donation_amount_apply_start_date = new Date(vm.configSettingAPS.donation_amount_apply_start_date);
      vm.isAddOrEditingAPS = true;
    };

    vm.removeAPS = function (itemId) {
      $scope.handleShowConfirm({
        message: 'この寄付金額を削除します。よろしいですか？'
      }, function () {
        $scope.handleShowWaiting();
        settingsApi.deleteConfigSet(itemId)
          .success(function (data) {
            $scope.handleShowToast('寄付金額の削除が完了しました。');
            handleSearchForAPS(true);
          })
          .error(function (res) {
            $scope.handleCloseWaiting();
            var message = (res) ? res.message || res.data.message : $filter('translate')('setting.form.controller.message.save_failed');
            $scope.handleShowToast(message, true);
          });
      });
    };
    // End pps

    vm.isUpdatedDonationAmount = function () {
      return vm.settingCloned && (vm.settingCloned.isSetMinimumDonationAmount !== vm.setting.isSetMinimumDonationAmount
        || vm.settingCloned.minimum_donation_amount_apply_future_value !== vm.setting.minimum_donation_amount_apply_future_value
        || vm.settingCloned.isSetAps !== vm.setting.isSetAps
        || vm.settingCloned.aps_apply_future_value !== vm.setting.aps_apply_future_value);
    };

    function update(isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.settingForm');
        return false;
      }

      // check max_point <= 20
      if (vm.setting.max_point > 20) {
        $scope.handleShowToast($filter('translate')('setting.form.max_point.error.max_20'), true);
        return;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('setting.form.controller.message.confirm_save')
      }, function () {
        // eslint-disable-next-line no-undef
        if (CKEDITOR.instances.hasOwnProperty('term') && CKEDITOR.instances.term) {
          // eslint-disable-next-line no-undef
          vm.setting.term = CKEDITOR.instances.term.getData();
        }
        // eslint-disable-next-line no-undef
        if (CKEDITOR.instances.hasOwnProperty('policy') && CKEDITOR.instances.policy) {
          // eslint-disable-next-line no-undef
          vm.setting.policy = CKEDITOR.instances.policy.getData();
        }

        var settingObject = vm.setting;
        delete settingObject.app;
        if (!settingObject.isSetMinimumDonationAmount) {
          settingObject.minimum_donation_amount_apply_future_value = null;
        }
        if (!settingObject.isSetAps) {
          settingObject.aps_apply_future_value = null;
        }

        settingObject.email = $scope.user.email;

        settingsApi.update(settingObject)
          .success(function (data) {
            $scope.handleShowToast($filter('translate')('setting.form.controller.message.save_success'));
          })
          .error(function (res) {
            var message = (res) ? res.message || res.data.message : $filter('translate')('setting.form.controller.message.save_failed');
            $scope.handleShowToast(message, true);
          });
      });
    }

    vm.pushVersion = function (os) {
      $scope.handleShowConfirm(
        {
          message: $filter('translate')('setting.form.message.push.confirm')
        },
        function () {
          settingsApi.pushVersion({ os: os })
            .then(function (rs) {
              $scope.handleShowToast($filter('translate')('setting.form.message.push.success'));
            })
            .catch(function (res) {
              $scope.handleShowToast($filter('translate')('setting.form.message.push.failed'), true);
            });
        }
      );
    };
  }
}());
