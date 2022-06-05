(function () {
  'use strict';

  angular
    .module('orders.municipality')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 3,
      roles: ['municipality'],
      class: 'fa fa-cart-plus',
      title: '注文',
      state: 'municipality.orders.list',
      parrent_state: 'municipality.orders'
    });
  }
}());
