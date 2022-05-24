(function () {
  'use strict';

  angular
    .module('companies-guest.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('company-guest', {
        abstract: true,
        url: '/company',
        template: '<ui-view/>'
      })
      .state('company-guest.create', {
        url: '/register',
        templateUrl: '/modules/companies/client/views/company-form.client.view.html',
        controller: 'CompanyFormController',
        controllerAs: 'vm',
        resolve: {
          companyResolve: newCompany
        },
        data: {
          pageTitle: '企業アカウント発行'
        }
      });

    newCompany.$inject = ['CompanyService'];
    function newCompany(CompanyService) {
      return new CompanyService();
    }
  }
}());
