(function () {
  'use strict';

  angular
    .module('requests_registration.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 20,
      roles: ['admin', 'sub_admin'],
      class: 'fa fa-check',
      title: '代理登録',
      state: 'admin.requests_registration.list',
      parrent_state: 'admin.request'
    });
  }
}());
