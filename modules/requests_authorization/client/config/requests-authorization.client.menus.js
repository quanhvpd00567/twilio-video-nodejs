(function () {
  'use strict';

  angular
    .module('requests_authorization.municipality')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 19,
      roles: ['munic_admin', 'munic_member'],
      class: 'fa fa-tasks',
      title: '承認トレイ',
      state: 'municipality.requests_authorization.list',
      parrent_state: 'municipality.requests_authorization'
    });
  }
}());
