(function () {
  'use strict';

  angular
    .module('municipalities.munic')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar',
      {
        position: 4,
        roles: ['munic_admin'],
        class: 'fa fa-wrench',
        title: 'ふるさと納税に関する設定',
        state: 'municipality.munic_product_config.product-config',
        parrent_state: 'municipality.munic_product_config'
      });
  }
}());
