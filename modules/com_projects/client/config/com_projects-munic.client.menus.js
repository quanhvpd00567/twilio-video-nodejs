(function () {
  'use strict';

  angular
    .module('com_projects.municipality')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 1,
      roles: ['munic_admin', 'munic_member'],
      class: 'fa fa-bars',
      title: '案件管理',
      state: 'municipality.com_projects.list',
      parrent_state: 'municipality.com_projects'
    });
  }
}());
