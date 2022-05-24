(function () {
  'use strict';

  angular
    .module('usings.municipality')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the usings module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 3,
      roles: ['munic_admin', 'munic_member'],
      class: 'fa fa-book',
      title: '寄付金の使い道管理',
      state: 'municipality.usings.list',
      parrent_state: 'municipality.usings'
    });
  }
}());
