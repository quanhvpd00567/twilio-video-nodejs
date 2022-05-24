(function () {
  'use strict';

  angular
    .module('sub_admins.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.sub_admins', {
        abstract: true,
        url: '/sub-admins',
        template: '<ui-view/>'
      })
      .state('admin.sub_admins.list', {
        url: '',
        templateUrl: '/modules/sub_admin/client/views/sub_admin-list.client.view.html',
        controller: 'SubAdminListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin'],
          pageTitle: '代理店一覧'
        }
      })
      .state('admin.sub_admins.create', {
        url: '/create',
        templateUrl: '/modules/sub_admin/client/views/sub_admin-form.client.view.html',
        controller: 'SubAdminFormController',
        controllerAs: 'vm',
        resolve: {
          subAdminResolve: newSubAdmin
        },
        data: {
          roles: ['admin'],
          pageTitle: '代理店登録'
        }
      })
      .state('admin.sub_admins.edit', {
        url: '/:subAdminId/edit',
        templateUrl: '/modules/sub_admin/client/views/sub_admin-form.client.view.html',
        controller: 'SubAdminFormController',
        controllerAs: 'vm',
        resolve: {
          subAdminResolve: getDetail
        },
        data: {
          roles: ['admin'],
          pageTitle: '代理店編集'
        }
      })
      .state('admin.sub_admins.detail', {
        url: '/:subAdminId/detail',
        templateUrl: '/modules/sub_admin/client/views/sub_admin-detail.client.view.html',
        controller: 'SubAdminDetailController',
        controllerAs: 'vm',
        resolve: {
          subAdminResolve: getDetail
        },
        data: {
          roles: ['admin'],
          pageTitle: '代理店詳細'
        }
      });

    getDetail.$inject = ['$stateParams', 'SubAdminService'];
    function getDetail($stateParams, SubAdminService) {
      return SubAdminService.get({
        subAdminId: $stateParams.subAdminId
      }).$promise;
    }

    newSubAdmin.$inject = ['$stateParams', 'SubAdminService'];
    function newSubAdmin($stateParams, SubAdminService) {
      return new SubAdminService();
    }
  }
}());
