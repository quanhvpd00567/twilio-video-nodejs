(function () {
  'use strict';

  angular
    .module('qas.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.qas', {
        abstract: true,
        url: '/qas',
        template: '<ui-view/>'
      })
      .state('admin.qas.list', {
        url: '',
        templateUrl: '/modules/qas/client/views/qa-list.client.view.html',
        controller: 'QAListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: 'Q&A一覧'
        }
      })
      .state('admin.qas.create', {
        url: '/create',
        templateUrl: '/modules/qas/client/views/qa-form.client.view.html',
        controller: 'QAFormController',
        controllerAs: 'vm',
        resolve: {
          qaResolve: newQA
        },
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: 'Q&A登録'
        }
      })
      .state('admin.qas.edit', {
        url: '/:qaId/edit',
        templateUrl: '/modules/qas/client/views/qa-form.client.view.html',
        controller: 'QAFormController',
        controllerAs: 'vm',
        resolve: {
          qaResolve: getQA
        },
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: 'Q&A編集'
        }
      })
      .state('admin.qas.detail', {
        url: '/:qaId/detail',
        templateUrl: '/modules/qas/client/views/qa-detail.client.view.html',
        controller: 'QADetailController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: 'Q&A詳細'
        }
      });

    getQA.$inject = ['$stateParams', 'QAsService'];
    function getQA($stateParams, QAsService) {
      return QAsService.get({
        qaId: $stateParams.qaId
      }).$promise;
    }

    newQA.$inject = ['$stateParams', 'QAsService'];
    function newQA($stateParams, QAsService) {
      if ($stateParams.cloneQAId) {
        return QAsService.get({
          qaId: $stateParams.cloneQAId
        }).$promise;
      }

      return new QAsService();
    }
  }
}());
