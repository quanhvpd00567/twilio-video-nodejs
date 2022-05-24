(function () {
  'use strict';

  angular
    .module('usings.municipality.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.usings', {
        abstract: true,
        url: '/usings',
        template: '<ui-view/>'
      })
      .state('municipality.usings.list', {
        url: '?{municipalityId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/usings/client/views/using-list.client.view.html',
        controller: 'UsingListController',
        controllerAs: 'vm',
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: '寄付金の使い道一覧'
        }
      })
      .state('municipality.usings.create', {
        url: '/create?{usingIdCloned, municipalityId}&{isNeedAuthorize: string}',
        templateUrl: '/modules/usings/client/views/using-form.client.view.html',
        controller: 'UsingFormController',
        controllerAs: 'vm',
        resolve: {
          usingResolve: newUsing
        },
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: '寄付金の使い道登録'
        }
      })
      .state('municipality.usings.edit', {
        url: '/:usingId/edit?{municipalityId: string}&{requestItemId: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/usings/client/views/using-form.client.view.html',
        controller: 'UsingFormController',
        controllerAs: 'vm',
        resolve: {
          usingResolve: getUsing
        },
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: '寄付金の使い道編集'
        }
      })
      .state('municipality.usings.detail', {
        url: '/:usingId/detail?{municipalityId: string}&{requestItemId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/usings/client/views/using-detail.client.view.html',
        controller: 'UsingDetailControllerusing',
        controllerAs: 'vm',
        resolve: {
          usingResolve: getUsing
        },
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: '寄付金の使い道詳細'
        }
      });

    getUsing.$inject = ['$stateParams', 'UsingsService'];
    function getUsing($stateParams, UsingsService) {
      return UsingsService.get({
        usingId: $stateParams.usingId
      }).$promise;
    }

    newUsing.$inject = ['$stateParams', 'UsingsService'];
    function newUsing($stateParams, UsingsService) {
      if ($stateParams.usingIdCloned) {
        return UsingsService.get({
          usingId: $stateParams.usingIdCloned
        }).$promise;
      }

      return new UsingsService();
    }
  }
}());
