(function () {
  'use strict';

  angular
    .module('com_projects.municipality.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.com_projects', {
        abstract: true,
        url: '/com-projects',
        template: '<ui-view/>'
      })
      .state('municipality.com_projects.list', {
        url: '',
        templateUrl: '/modules/com_projects/client/views/munic/com_projects-list.client.view.html',
        controller: 'ComProjectListMunicController',
        controllerAs: 'vm',
        data: {
          roles: ['munic_admin', 'munic_member'],
          pageTitle: '案件一覧'
        }
      });
    // .state('municipality.com_projects.detail', {
    //   url: '/:comProjectId/detail',
    //   templateUrl: '/modules/com_projects/client/views/munic/com_projects-detail.client.view.html',
    //   controller: 'ComProjectDetailMunicController',
    //   controllerAs: 'vm',
    //   data: {
    //     roles: ['munic_admin', 'munic_member'],
    //     pageTitle: '案件詳細'
    //   }
    // });
  }
}());
