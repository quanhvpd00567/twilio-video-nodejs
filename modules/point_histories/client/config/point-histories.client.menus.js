(function () {
  'use strict';

  angular
    .module('pointHistories.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the pointHistories module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 7,
      roles: ['sub_admin'],
      class: 'fa fa-clock-o',
      title: 'ポイント付与履歴',
      state: 'admin.pointHistories.list',
      parrent_state: 'admin.pointHistories'
    });
  }
}());
