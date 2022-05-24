(function () {
  'use strict';

  angular
    .module('settings_company.company')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 20,
      roles: ['company'],
      class: 'fa fa-cog',
      title: '設定',
      state: 'company.settings_company.form',
      parrent_state: 'company.settings_company'
    });
  }
}());
