(function () {
  'use strict';

  angular
    .module('municipalities.munic')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 2,
      roles: ['municipality'],
      class: 'fa fa-wrench',
      title: '自治体情報管理',
      state: 'municipality.munic.munic_setting',
      parrent_state: 'municipality.munic'
    });
  }
}());
