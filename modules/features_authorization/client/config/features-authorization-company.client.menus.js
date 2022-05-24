(function () {
  'use strict';

  angular
    .module('features_authorization.company')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 20,
      roles: ['company'],
      class: 'fa fa-check',
      title: '企業情報代理登録',
      state: 'company.features_authorization.edit',
      parrent_state: 'company.features_authorization'
    });
  }
}());
