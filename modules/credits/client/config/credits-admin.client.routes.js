(function () {
  'use strict';

  // Setting up route
  angular
    .module('credits.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('credits', {
        abstract: true,
        url: '/credits',
        template: '<ui-view/>'
      })
      .state('credits.form', {
        url: '',
        templateUrl: '/modules/credits/client/views/company/credit-form.client.view.html',
        controller: 'CreditFormController',
        controllerAs: 'vm',
        data: {
          // roles: ['admin'],
          pageTitle: 'クレジットカード設定'
        }
      });
  }
}());
