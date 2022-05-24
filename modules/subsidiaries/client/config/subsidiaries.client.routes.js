(function () {
  'use strict';

  angular
    .module('subsidiaries.company.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('company.subsidiaries', {
        abstract: true,
        url: '/subsidiaries',
        template: '<ui-view/>'
      })
      .state('company.subsidiaries.list', {
        url: '?{companyId: string}&{key: string}',
        templateUrl: '/modules/subsidiaries/client/views/subsidiary-list.client.view.html',
        controller: 'SubsidiaryListController',
        controllerAs: 'vm',
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '子会社一覧'
        }
      })
      .state('company.subsidiaries.create', {
        url: '/create?{companyId: string}',
        templateUrl: '/modules/subsidiaries/client/views/subsidiary-form.client.view.html',
        controller: 'SubsidiaryFormController',
        controllerAs: 'vm',
        resolve: {
          subsidiary: newSubsidiary
        },
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '子会社登録'
        }
      })
      .state('company.subsidiaries.edit', {
        url: '/:subsidiaryId/edit?{companyId: string}',
        templateUrl: '/modules/subsidiaries/client/views/subsidiary-form.client.view.html',
        controller: 'SubsidiaryFormController',
        controllerAs: 'vm',
        resolve: {
          subsidiary: getDetail
        },
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '子会社編集'
        }
      })
      .state('company.subsidiaries.detail', {
        url: '/:subsidiaryId/detail?{companyId: string}',
        templateUrl: '/modules/subsidiaries/client/views/subsidiary-detail.client.view.html',
        controller: 'SubsidiaryDetailController',
        controllerAs: 'vm',
        resolve: {
          subsidiary: getDetail
        },
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '子会社詳細'
        }
      });

    getDetail.$inject = ['$stateParams', 'SubsidiaryService'];
    function getDetail($stateParams, SubsidiaryService) {
      return SubsidiaryService.get({
        subsidiaryId: $stateParams.subsidiaryId,
        companyId: $stateParams.companyId
      }).$promise;
    }

    newSubsidiary.$inject = ['SubsidiaryService'];
    function newSubsidiary(SubsidiaryService) {
      return new SubsidiaryService();
    }
  }
}());
