(function () {
  'use strict';

  angular
    .module('projects.municipality')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the projects module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 2,
      roles: ['munic_admin', 'munic_member'],
      class: 'fa fa-briefcase',
      title: 'プロジェクト管理',
      state: 'municipality.projects.list',
      parrent_state: 'municipality.projects'
    });
  }
}());
