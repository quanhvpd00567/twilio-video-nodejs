(function () {
  'use strict';

  angular
    .module('settings-guest.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('guest-settings', {
        abstract: true,
        url: '',
        template: '<ui-view/>'
      })
      .state('guest-settings.config', {
        url: '/term',
        templateUrl: '/modules/settings/client/views/guest/term-detail.client.view.html',
        controller: 'SettingTermGuestController',
        controllerAs: 'vm',
        resolve: {
        },
        data: {
          pageTitle: '利用規約'
        }
      })
      .state('guest-settings.policy', {
        url: '/policy',
        templateUrl: '/modules/settings/client/views/guest/policy-detail.client.view.html',
        controller: 'SettingTermGuestController',
        controllerAs: 'vm',
        resolve: {
        },
        data: {
          pageTitle: 'プライバシーポリシー'
        }
      });
  }
}());
