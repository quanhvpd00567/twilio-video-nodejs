(function () {
  'use strict';

  angular
    .module('core.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    menuService.addMenuItem('user', {
      position: 0,
      roles: ['admin', 'sub_admin', 'company', 'munic_admin', 'munic_member'],
      class: 'fa fa-lock',
      title: 'パスワード変更',
      state: 'settings',
      parrent_state: 'settings'
    });
  }
}());
