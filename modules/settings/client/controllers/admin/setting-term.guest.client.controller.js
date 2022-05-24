(function () {
  'use strict';

  angular
    .module('settings.guest')
    .controller('SettingTermGuestController', SettingTermGuestController);

  SettingTermGuestController.$inject = ['$scope', '$state', 'settingsApi', '$filter', '$sce'];

  function SettingTermGuestController($scope, $state, settingsApi, $filter, $sce) {
    var vm = this;

    onCreate();

    function onCreate() {
      settingsApi.getInfo()
        .success(function (res) {
          vm.term = $sce.trustAsHtml(res.term);
          vm.policy = $sce.trustAsHtml(res.policy);
        });
    }

  }
}());
