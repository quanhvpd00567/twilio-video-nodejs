(function () {
  'use strict';

  angular
    .module('orders.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 1,
      roles: ['admin'],
      class: 'fa fa-clock-o',
      title: '寄付履歴',
      state: 'admin.orders.history',
      parrent_state: 'admin.orders'
    });
  }
}());
