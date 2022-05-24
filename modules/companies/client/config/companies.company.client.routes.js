(function () {
  'use strict';

  angular
    .module('companies.company.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('company.companies', {
        abstract: true,
        url: '/companies',
        template: '<ui-view/>'
      })
      .state('company.companies.edit', {
        url: '?{companyId: string}',
        templateUrl: '/modules/companies/client/views/company/company-edit.client.view.html',
        controller: 'CompanyEditCompanyController',
        controllerAs: 'vm',
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '企業情報の編集'
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
