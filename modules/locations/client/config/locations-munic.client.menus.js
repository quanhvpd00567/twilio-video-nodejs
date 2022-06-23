(function () {
  'use strict';

  angular
    .module('locations.munic')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the locations module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 5,
      roles: ['municipality'],
      class: 'fa fa-map-marker',
      title: '導入施設管理',
      state: 'municipality.locations.list',
      parrent_state: 'municipality.locations'
    });
  }
}());
