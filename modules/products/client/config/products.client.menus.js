(function () {
  'use strict';

  angular
    .module('products.municipality')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 3,
      roles: ['munic_admin', 'munic_member'],
      class: 'fa fa-product-hunt',
      title: '返礼品',
      state: 'municipality.products.list',
      parrent_state: 'municipality.products'
    });
  }
}());
