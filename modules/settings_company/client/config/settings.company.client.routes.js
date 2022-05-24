(function () {
  'use strict';

  angular
    .module('settings_company.company.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('company.settings_company', {
        abstract: true,
        url: '/settings-app-ranking',
        template: '<ui-view/>'
      })
      .state('company.settings_company.form', {
        url: '',
        templateUrl: '/modules/settings_company/client/views/settings-company-form.client.view.html',
        controller: 'SettingsCompanyFormController',
        controllerAs: 'vm',
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: 'アプリランキング表示'
        }
      });

    getDetail.$inject = ['$stateParams', 'CompanyService'];
    function getDetail($stateParams, CompanyService) {
      return CompanyService.get({
        companyId: $stateParams.companyId
      }).$promise;
    }
  }
}());
