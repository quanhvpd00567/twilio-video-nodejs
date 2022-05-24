(function () {
  'use strict';

  angular
    .module('notices.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the notices module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 7,
      roles: ['admin', 'sub_admin'],
      class: 'fa fa-bell-o',
      title: 'お知らせ配信',
      state: 'admin.notices.list',
      parrent_state: 'admin.notices'
    });
  }
}());
