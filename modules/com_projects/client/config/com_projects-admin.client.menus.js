(function () {
  'use strict';

  angular
    .module('com_projects.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 3,
      roles: ['admin', 'sub_admin'],
      class: 'fa fa-bars',
      title: '案件管理',
      state: 'admin.com_projects.list',
      parrent_state: 'admin.com_projects'
    });
  }
}());
