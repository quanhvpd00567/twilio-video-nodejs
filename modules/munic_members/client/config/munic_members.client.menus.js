(function () {
  'use strict';

  angular
    .module('munic_members.municipality')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 3,
      roles: ['munic_admin'],
      class: 'fa fa-user',
      title: '自治体メンバー管理',
      state: 'municipality.munic_members.list',
      parrent_state: 'municipality.munic_members'
    });
  }
}());
