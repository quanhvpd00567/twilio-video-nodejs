(function () {
  'use strict';

  angular
    .module('settings_version.admin')
    .controller('SettingVersionFormController', SettingVersionFormController);

  SettingVersionFormController.$inject = ['$scope', '$state', 'settingsApi', '$filter'];

  function SettingVersionFormController($scope, $state, settingsApi, $filter) {
    var vm = this;
    vm.update = update;
    vm.TYPE = {
      IOS: 'ios',
      ANDROID: 'android'
    };

    onCreate();

    function onCreate() {
      settingsApi.get()
        .success(function (data) {
          vm.setting = data;
        })
        .error(function (err) {
          $scope.handleCloseWaiting();
          var message = (err) ? err.message || err.data.message : $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    function update(isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.SettingForm');
        return false;
      }
      $scope.handleShowConfirm({
        message: $filter('translate')('setting_version.form.controller.message.confirm_save')
      }, function () {
        var app = vm.setting.app;
        settingsApi.update({ app: app })
          .success(function (data) {
            $scope.handleShowToast($filter('translate')('setting_version.form.controller.message.save_success'));
          })
          .error(function (res) {
            var message = (res) ? res.message || res.data.message : $filter('translate')('setting_version.form.controller.message.save_failed');
            $scope.handleShowToast(message, true);
          });
      });
    }

    vm.handlerStartEndVersionBlur = function (type) {
      if (!handlerStartEndVersion(type)) {
        $scope.$broadcast('show-errors-check-validity', 'vm.SettingForm');
        return false;
      }
    };

    function handlerStartEndVersion(type) {
      if (type === vm.TYPE.IOS) {
        if (vm.setting.app.ios_version && vm.setting.app.ios_version_require) {
          if (parseFloat(vm.setting.app.ios_version) < parseFloat(vm.setting.app.ios_version_require)) {
            vm.SettingForm.ios_version_require.$setValidity('start_end_version', false);
            return false;
          } else {
            vm.SettingForm.ios_version_require.$setValidity('start_end_version', true);
            return true;
          }
        }
      }
      if (type === vm.TYPE.ANDROID) {
        if (vm.setting.app.android_version && vm.setting.app.android_version_require) {
          if (parseFloat(vm.setting.app.android_version) < parseFloat(vm.setting.app.android_version_require)) {
            vm.SettingForm.android_version_require.$setValidity('start_end_version', false);
            return false;
          } else {
            vm.SettingForm.android_version_require.$setValidity('start_end_version', true);
            return true;
          }
        }
      }
      return true;
    }

    vm.pushVersion = function (os) {
      $scope.handleShowConfirm(
        {
          message: $filter('translate')('setting_version.form.controller.message.confirm_push')
        },
        function () {
          settingsApi.pushVersion({ os: os })
            .then(function (rs) {
              $scope.handleShowToast($filter('translate')('setting_version.form.controller.message.push_success'));
            })
            .catch(function (res) {
              $scope.handleShowToast($filter('translate')('setting_version.form.controller.message.push_failed'), true);
            });
        }
      );
    };
  }
}());
