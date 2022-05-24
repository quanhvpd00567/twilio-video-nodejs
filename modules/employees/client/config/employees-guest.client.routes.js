(function () {
  'use strict';

  angular
    .module('employees-guest.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('employees-guest', {
        abstract: true,
        url: '/guest',
        template: '<ui-view/>'
      })
      .state('employees-guest.create', {
        url: '/employees/:info',
        templateUrl: '/modules/employees/client/views/guest/employee-form.client.view.html',
        controller: 'EmployeeGuestFormController',
        controllerAs: 'vm',
        resolve: {
          employee: newEmployee
        },
        data: {
          pageTitle: '「ふふる」参加者登録'
        }
      });

    newEmployee.$inject = ['EmployeeService'];
    function newEmployee(EmployeeService) {
      return new EmployeeService();
    }
  }
}());
