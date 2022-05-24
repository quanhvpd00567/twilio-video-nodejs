(function () {
  'use strict';

  angular
    .module('employees.company')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 3,
      roles: ['company'],
      class: 'fa fa-user',
      title: '企業参加者管理',
      state: 'company.employees.list',
      parrent_state: 'company.employees'
    });
  }
}());
