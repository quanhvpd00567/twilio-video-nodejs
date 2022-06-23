(function () {
  'use strict';

  angular
    .module('locations.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the locations module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 5,
      roles: ['admin'],
      class: 'fa fa-map-marker',
      title: '導入施設管理',
      state: 'admin.locations.list',
      parrent_state: 'admin.locations'
    });
  }
}());
