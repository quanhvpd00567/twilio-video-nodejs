(function () {
  'use strict';

  angular
    .module('orders.admin1')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    // menuService.addMenuItem('topbar', {
    //   position: 3,
    //   roles: ['admin'],
    //   class: 'fa fa-cart-plus',
    //   title: '注文',
    //   state: 'admin.orders.list',
    //   parrent_state: 'admin.orders'
    // });
  }
}());
