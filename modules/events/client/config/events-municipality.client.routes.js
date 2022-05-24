(function () {
  'use strict';

  angular
    .module('events.municipality.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.events', {
        abstract: true,
        url: '/municipality-events',
        template: '<ui-view/>'
      })
      .state('municipality.events.list', {
        url: '',
        templateUrl: '/modules/events/client/views/municipality/event-list.client.view.html',
        controller: 'EventMunicipalityListController',
        controllerAs: 'vm',
        data: {
          roles: ['munic_admin', 'munic_member'],
          pageTitle: 'イベント一覧'
        }
      })
      .state('municipality.events.detail', {
        url: '/:eventId/detail',
        templateUrl: '/modules/events/client/views/municipality/event-detail.client.view.html',
        controller: 'EventMunicipalityDetailController',
        controllerAs: 'vm',
        data: {
          roles: ['munic_admin', 'munic_member'],
          pageTitle: 'イベント詳細'
        }
      });
  }
}());
