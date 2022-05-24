(function () {
  'use strict';

  angular
    .module('requests_application.municipality')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 19,
      roles: ['admin', 'sub_admin'],
      class: 'fa fa-tasks',
      title: '申請トレイ',
      state: 'municipality.requests_application.list',
      parrent_state: 'municipality.requests_application'
    });
  }
}());
