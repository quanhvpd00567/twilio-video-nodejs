(function () {
  'use strict';

  angular
    .module('municipalities.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 4,
      roles: ['admin'],
      class: 'fa fa-area-chart',
      title: '自治体管理',
      state: 'admin.municipalities.list',
      parrent_state: 'admin.municipalities'
    });
  }
}());
