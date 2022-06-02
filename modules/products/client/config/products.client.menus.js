(function () {
  'use strict';

  angular
    .module('products.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 2,
      roles: ['municipality', 'admin'],
      class: 'fa fa-product-hunt',
      title: '返礼品',
      state: 'admin.products.list',
      parrent_state: 'admin.products'
    });
  }
}());
