(function () {
  'use strict';

  angular
    .module('employees.company.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('company.employees', {
        abstract: true,
        url: '/employees',
        template: '<ui-view/>'
      })
      .state('company.employees.list', {
        url: '?{companyId: string}&{key: string}',
        templateUrl: '/modules/employees/client/views/employee-list.client.view.html',
        controller: 'EmployeeListController',
        controllerAs: 'vm',
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '企業参加者一覧'
        }
      })
      .state('company.employees.create', {
        url: '/create?{companyId: string}',
        templateUrl: '/modules/employees/client/views/employee-form.client.view.html',
        controller: 'EmployeeFormController',
        controllerAs: 'vm',
        resolve: {
          employee: newEmployee
        },
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '企業参加者登録'
        }
      })
      .state('company.employees.edit', {
        url: '/:employeeId/edit?{companyId: string}',
        templateUrl: '/modules/employees/client/views/employee-form.client.view.html',
        controller: 'EmployeeFormController',
        controllerAs: 'vm',
        resolve: {
          employee: getDetail
        },
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '企業参加者編集'
        }
      })
      .state('company.employees.detail', {
        url: '/:employeeId/detail?{companyId: string}',
        templateUrl: '/modules/employees/client/views/employee-detail.client.view.html',
        controller: 'EmployeeDetailController',
        controllerAs: 'vm',
        resolve: {
          employee: getDetail
        },
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '企業参加者詳細'
        }
      })
      .state('company.employees.import', {
        url: '/import?{companyId: string}',
        templateUrl: '/modules/employees/client/views/employee-import.client.view.html',
        controller: 'EmployeeImportController',
        controllerAs: 'vm',
        data: {
          roles: ['company', 'admin', 'sub_admin'],
          pageTitle: '企業参加者一括登録（更新）'
        }
      });

    getDetail.$inject = ['$stateParams', 'EmployeeService'];
    function getDetail($stateParams, EmployeeService) {
      return EmployeeService.get({
        employeeId: $stateParams.employeeId,
        companyId: $stateParams.companyId
      }).$promise;
    }

    newEmployee.$inject = ['EmployeeService'];
    function newEmployee(EmployeeService) {
      return new EmployeeService();
    }
  }
}());
