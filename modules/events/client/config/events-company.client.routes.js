(function () {
  'use strict';

  angular
    .module('events.company.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('company.events', {
        abstract: true,
        url: '/events',
        template: '<ui-view/>'
      })
      .state('company.events.list', {
        url: '?{companyId: string}',
        templateUrl: '/modules/events/client/views/company/event-list.client.view.html',
        controller: 'EventListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin', 'company'],
          pageTitle: 'イベント一覧'
        }
      })
      .state('company.events.detail', {
        url: '/:eventId/detail?{companyId: string}',
        templateUrl: '/modules/events/client/views/company/event-detail.client.view.html',
        controller: 'EventDetailController',
        controllerAs: 'vm',
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: 'イベント詳細'
        }
      })
      .state('company.events.project_search', {
        url: '/projects?{companyId: string}&{key: string}',
        templateUrl: '/modules/events/client/views/company/event-project-search.client.view.html',
        controller: 'EventProjectSearchController',
        controllerAs: 'vm',
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '自治体のプロジェクト一覧'
        }
      })
      .state('company.events.projects_apply', {
        url: '/projects/apply?{companyId: string}&{key: string}',
        templateUrl: '/modules/events/client/views/company/event-project-apply.client.view.html',
        controller: 'EventProjectApplyController',
        controllerAs: 'vm',
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '企業版ふるさと納税申し込み'
        }
      })
      .state('company.events.comproject_detail', {
        url: '/:eventId/comprojects/:comProjectId/detail',
        templateUrl: '/modules/com_projects/client/views/company/com_projects-detail.client.view.html',
        controller: 'ComProjectDetailCompanyController',
        controllerAs: 'vm',
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '参加者一覧'
        }
      });
  }
}());
