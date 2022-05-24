(function () {
  'use strict';

  angular
    .module('events.company')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 2,
      roles: ['company'],
      class: 'fa fa-calendar',
      title: 'イベント管理',
      state: 'company.events.list',
      parrent_state: 'company.events'
    });
  }
}());
