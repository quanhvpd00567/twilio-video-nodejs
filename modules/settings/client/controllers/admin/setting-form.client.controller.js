(function () {
  'use strict';

  angular
    .module('settings.admin')
    .controller('SettingFormController', SettingFormController);

  SettingFormController.$inject = ['$scope', '$state', 'settingsApi', '$filter'];

  function SettingFormController($scope, $state, settingsApi, $filter) {
    var vm = this;
    vm.update = update;
    onCreate();

    function onCreate(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      settingsApi.get()
        .success(function (data) {
          $scope.handleCloseWaiting();
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
        $scope.$broadcast('show-errors-check-validity', 'vm.settingForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('setting.form.controller.message.confirm_save')
      }, function () {
        // // eslint-disable-next-line no-undef
        // if (CKEDITOR.instances.hasOwnProperty('term') && CKEDITOR.instances.term) {
        //   // eslint-disable-next-line no-undef
        //   vm.setting.term = CKEDITOR.instances.term.getData();
        // }
        // // eslint-disable-next-line no-undef
        // if (CKEDITOR.instances.hasOwnProperty('policy') && CKEDITOR.instances.policy) {
        //   // eslint-disable-next-line no-undef
        //   vm.setting.policy = CKEDITOR.instances.policy.getData();
        // }

        var settingObject = vm.setting;
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
      $scope.handleShowConfirm({ message: $filter('translate')('setting.form.message.push.confirm') },
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
