(function () {
  'use strict';

  angular
    .module('events.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.events', {
        abstract: true,
        url: '/events',
        template: '<ui-view/>'
      })
      .state('admin.events.list', {
        url: '',
        templateUrl: '/modules/events/client/views/admin/event-list.client.view.html',
        controller: 'EventMunicipalityListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: 'イベント一覧'
        }
      })
      .state('admin.events.detail', {
        url: '/:eventId/detail',
        templateUrl: '/modules/events/client/views/admin/event-detail.client.view.html',
        controller: 'EventMunicipalityDetailController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: 'イベント詳細'
        }
      });
  }
}());
