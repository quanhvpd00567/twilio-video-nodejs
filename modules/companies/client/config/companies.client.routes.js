(function () {
  'use strict';

  angular
    .module('companies.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.companies', {
        abstract: true,
        url: '/companies',
        template: '<ui-view/>'
      })
      .state('admin.companies.list', {
        url: '',
        templateUrl: '/modules/companies/client/views/company-list.client.view.html',
        controller: 'CompanyListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin', 'company'],
          pageTitle: '企業一覧'
        }
      })
      .state('admin.companies.detail', {
        url: '/:companyId/detail',
        templateUrl: '/modules/companies/client/views/company-detail.client.view.html',
        controller: 'CompanyDetailController',
        controllerAs: 'vm',
        resolve: {
          companyResolve: getDetail
        },
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: '企業詳細'
        }
      })
      .state('admin.companies.create', {
        url: '/create',
        templateUrl: '/modules/companies/client/views/company-edit.client.view.html',
        controller: 'CompanyEditController',
        controllerAs: 'vm',
        resolve: {
          companyResolve: newCompany
        },
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: '企業登録'
        }
      })
      .state('admin.companies.edit', {
        url: '/:companyId/edit',
        templateUrl: '/modules/companies/client/views/company-edit.client.view.html',
        controller: 'CompanyEditController',
        controllerAs: 'vm',
        resolve: {
          companyResolve: getDetail
        },
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: '企業編集'
        }
      });

    getDetail.$inject = ['$stateParams', 'CompanyService'];
    function getDetail($stateParams, CompanyService) {
      return CompanyService.get({
        companyId: $stateParams.companyId
      }).$promise;
    }

    newCompany.$inject = ['CompanyService'];
    function newCompany(CompanyService) {
      return new CompanyService();
    }
  }
}());
