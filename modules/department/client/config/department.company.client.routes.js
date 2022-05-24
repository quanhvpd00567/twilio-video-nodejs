(function () {
  'use strict';

  angular
    .module('departments.company.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('company.departments', {
        abstract: true,
        url: '/departments',
        template: '<ui-view/>'
      })
      .state('company.departments.list', {
        url: '',
        templateUrl: '/modules/department/client/views/department-list.client.view.html',
        controller: 'DepartmentListCompanyController',
        controllerAs: 'vm',
        data: {
          roles: ['company'],
          pageTitle: '部署一覧'
        }
      })
      .state('company.departments.create', {
        url: '/create',
        templateUrl: '/modules/department/client/views/department-form.client.view.html',
        controller: 'DepartmentFormCompanyController',
        controllerAs: 'vm',
        resolve: {
          departmentResolve: newDepartment
        },
        data: {
          roles: ['company'],
          pageTitle: '部署登録'
        }
      })
      .state('company.departments.edit', {
        url: '/:departmentId/edit',
        templateUrl: '/modules/department/client/views/department-form.client.view.html',
        controller: 'DepartmentFormCompanyController',
        controllerAs: 'vm',
        resolve: {
          departmentResolve: getDetail
        },
        data: {
          roles: ['company'],
          pageTitle: '部署編集'
        }
      })
      .state('company.departments.detail', {
        url: '/:departmentId/detail',
        templateUrl: '/modules/department/client/views/department-detail.client.view.html',
        controller: 'DepartmentDetailCompanyController',
        controllerAs: 'vm',
        resolve: {
          departmentResolve: getDetail
        },
        data: {
          roles: ['company'],
          pageTitle: '部署詳細'
        }
      });

    getDetail.$inject = ['$stateParams', 'DepartmentService'];
    function getDetail($stateParams, DepartmentService) {
      return DepartmentService.get({
        departmentId: $stateParams.departmentId
      }).$promise;
    }

    newDepartment.$inject = ['$stateParams', 'DepartmentService'];
    function newDepartment($stateParams, DepartmentService) {
      return new DepartmentService();
    }
  }
}());
