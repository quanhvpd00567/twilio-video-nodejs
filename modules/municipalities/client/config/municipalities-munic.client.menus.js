(function () {
  'use strict';

  angular
    .module('municipalities.munic')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    // menuService.addMenuItem('topbar',
    //   {
    //     position: 4,
    //     roles: ['munic_admin'],
    //     class: 'fa fa-wrench',
    //     title: 'ふるさと納税に関する設定',
    //     state: 'municipality.munic.product-config',
    //     parrent_state: 'municipality.munic'
    //   });

    menuService.addMenuItem('topbar',
      {
        position: 5,
        roles: ['munic_admin'],
        class: 'fa fa-wrench',
        title: '自治体情報の編集',
        state: 'municipality.munic.settings',
        parrent_state: 'municipality.munic'
      });
  }
}());
