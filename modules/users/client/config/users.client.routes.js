(function () {
  'use strict';

  // Setting up route
  angular
    .module('users.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    // Users state routing
    $stateProvider
      .state('settings', {
        url: '/password',
        templateUrl: '/modules/users/client/views/users/change-password.client.view.html',
        controller: 'ChangePasswordController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'パスワード変更',
          roles: ['admin', 'municipality', 'location']
        }
      })
      .state('authentication', {
        abstract: true,
        url: '/authentication',
        template: '<ui-view/>',
        controllerAs: 'vm'
      })
      .state('authentication.signin', {
        url: '/signin?err',
        templateUrl: '/modules/users/client/views/users/signin.client.view.html',
        controller: 'AuthenticationController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'ログイン'
        }
      })
      .state('authentication.reset_password', {
        url: '/reset-password',
        templateUrl: '/modules/users/client/views/users/reset-password.client.view.html',
        controller: 'ResetPasswordController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'パスワードの再設定'
        }
      })
      .state('authentication.sent_mail', {
        url: '/sent-mail',
        templateUrl: '/modules/users/client/views/users/sent-email-reset-password.client.view.html',
        controller: 'SentEmailResetPasswordController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'メールを送信しました'
        }
      });
  }
}());
