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
      title: 'Zoomus demo',
      state: 'admin.locations.demo',
      parrent_state: 'admin.locations'
    });
  }
}());
