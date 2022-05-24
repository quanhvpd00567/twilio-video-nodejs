(function () {
  'use strict';

  angular
    .module('companies.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 1,
      roles: ['admin', 'sub_admin'],
      class: 'fa fa-building-o',
      title: '企業管理',
      state: 'admin.companies.list',
      parrent_state: 'admin.companies'
    });
  }
}());
