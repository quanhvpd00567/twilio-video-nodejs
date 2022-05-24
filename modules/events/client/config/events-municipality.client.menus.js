(function () {
  'use strict';

  angular
    .module('events.municipality')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 2,
      roles: ['munic_admin', 'munic_member'],
      class: 'fa fa-calendar',
      title: 'イベント管理',
      state: 'municipality.events.list',
      parrent_state: 'municipality.events'
    });
  }
}());
