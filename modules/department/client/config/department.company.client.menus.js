(function () {
  'use strict';

  angular
    .module('departments.company')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 4,
      roles: ['company'],
      class: 'fa fa-bandcamp',
      title: ' 部署管理',
      state: 'company.departments.list',
      parrent_state: 'company.departments'
    });
  }
}());
