(function () {
  'use strict';

  angular
    .module('settings_version.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.settings_version', {
        abstract: true,
        url: '/settings-version',
        template: '<ui-view/>'
      })
      .state('admin.settings_version.config', {
        url: '',
        templateUrl: '/modules/settings_version/client/views/admin/setting-version-form.client.view.html',
        controller: 'SettingVersionFormController',
        controllerAs: 'vm',
        resolve: {
        },
        data: {
          pageTitle: 'アプリバージョン管理'
        }
      });
  }
}());
