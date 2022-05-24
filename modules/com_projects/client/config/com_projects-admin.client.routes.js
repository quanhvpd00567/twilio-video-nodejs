(function () {
  'use strict';

  angular
    .module('com_projects.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.com_projects', {
        abstract: true,
        url: '/com-projects',
        template: '<ui-view/>'
      })
      .state('admin.com_projects.list', {
        url: '',
        templateUrl: '/modules/com_projects/client/views/admin/com_projects-list.client.view.html',
        controller: 'ComProjectListAdminController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: '案件一覧'
        }
      })
      .state('admin.com_projects.detail', {
        url: '/:comProjectId/detail',
        templateUrl: '/modules/com_projects/client/views/admin/com_projects-detail.client.view.html',
        controller: 'ComProjectDetailAdminController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: '案件詳細'
        }
      });

    getDetail.$inject = ['$stateParams', 'EmployeeService'];
    function getDetail($stateParams, EmployeeService) {
      return EmployeeService.get({
        employeeId: $stateParams.employeeId
      }).$promise;
    }

    newEmployee.$inject = ['EmployeeService'];
    function newEmployee(EmployeeService) {
      return new EmployeeService();
    }
  }
}());
