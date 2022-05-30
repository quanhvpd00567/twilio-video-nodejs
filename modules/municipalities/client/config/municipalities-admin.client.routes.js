(function () {
  'use strict';

  angular
    .module('municipalities.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.municipalities', {
        abstract: true,
        url: '/municipalities',
        template: '<ui-view/>'
      })
      .state('admin.municipalities.list', {
        url: '',
        templateUrl: '/modules/municipalities/client/views/admin/municipality-list.client.view.html',
        controller: 'MunicipalityAdminListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin'],
          pageTitle: '自治体一覧'
        }
      })
      .state('admin.municipalities.detail', {
        url: '/:municId/detail',
        templateUrl: '/modules/municipalities/client/views/admin/municipality-detail.client.view.html',
        controller: 'MunicipalityAdminDetailController',
        controllerAs: 'vm',
        resolve: {
          municipality: getDetail
        },
        data: {
          roles: ['admin'],
          pageTitle: '自治体詳細'
        }
      })
      .state('admin.municipalities.edit', {
        url: '/:municId/edit',
        templateUrl: '/modules/municipalities/client/views/admin/municipality-form.client.view.html',
        controller: 'MunicipalityAdminFormController',
        controllerAs: 'vm',
        resolve: {
          municipality: getDetail
        },
        data: {
          roles: ['admin'],
          pageTitle: '自治体編集'
        }
      })
      .state('admin.municipalities.create', {
        url: '/create',
        templateUrl: '/modules/municipalities/client/views/admin/municipality-form.client.view.html',
        controller: 'MunicipalityAdminFormController',
        controllerAs: 'vm',
        resolve: {
          municipality: newMunic
        },
        data: {
          roles: ['admin'],
          pageTitle: '自治体登録'
        }
      });

    getDetail.$inject = ['$stateParams', 'MunicipalitiesService'];
    function getDetail($stateParams, MunicipalitiesService) {
      return MunicipalitiesService.get({
        municId: $stateParams.municId
      }).$promise;
    }

    newMunic.$inject = ['MunicipalitiesService'];
    function newMunic(MunicipalitiesService) {
      return new MunicipalitiesService();
    }
  }
}());
