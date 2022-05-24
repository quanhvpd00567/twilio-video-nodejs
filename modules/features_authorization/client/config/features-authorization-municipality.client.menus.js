(function () {
  'use strict';

  angular
    .module('features_authorization.municipality')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 20,
      roles: ['munic_admin', 'munic_member'],
      class: 'fa fa-check',
      title: '自治体情報代理登録',
      state: 'municipality.features_authorization.edit',
      parrent_state: 'municipality.features_authorization'
    });
  }
}());
