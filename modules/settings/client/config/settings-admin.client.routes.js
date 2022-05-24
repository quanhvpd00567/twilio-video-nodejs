(function () {
  'use strict';

  angular
    .module('settings.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.settings', {
        abstract: true,
        url: '/settings',
        template: '<ui-view/>'
      })
      .state('admin.settings.config', {
        url: '',
        templateUrl: '/modules/settings/client/views/admin/setting-form.client.view.html',
        controller: 'SettingFormController',
        controllerAs: 'vm',
        resolve: {
        },
        data: {
          pageTitle: 'システム設定'
        }
      });
  }
}());
