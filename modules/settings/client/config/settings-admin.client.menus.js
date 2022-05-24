(function () {
  'use strict';

  angular
    .module('settings.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the settings module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 9,
      roles: ['admin'],
      class: 'fa fa-cog',
      title: 'システム設定',
      state: 'admin.settings.config',
      parrent_state: 'admin.settings'
    });
  }
}());
