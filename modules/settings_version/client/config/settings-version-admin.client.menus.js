(function () {
  'use strict';

  angular
    .module('settings_version.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the settings module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 10,
      roles: ['ktcadmin'],
      class: 'fa fa-code-fork',
      title: 'バージョン管理',
      state: 'admin.settings_version.config',
      parrent_state: 'admin.settings_version'
    });
  }
}());
