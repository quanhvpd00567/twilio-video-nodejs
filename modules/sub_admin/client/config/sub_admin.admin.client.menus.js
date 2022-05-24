(function () {
  'use strict';

  angular
    .module('sub_admins.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 4,
      roles: ['admin'],
      class: 'fa fa-user-secret',
      title: '代理店管理',
      state: 'admin.sub_admins.list',
      parrent_state: 'admin.sub_admins'
    });
  }
}());
