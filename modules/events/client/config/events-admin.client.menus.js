(function () {
  'use strict';

  angular
    .module('events.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 2,
      roles: ['admin', 'sub_admin'],
      class: 'fa fa-calendar',
      title: 'イベント管理',
      state: 'admin.events.list',
      parrent_state: 'admin.events'
    });
  }
}());
