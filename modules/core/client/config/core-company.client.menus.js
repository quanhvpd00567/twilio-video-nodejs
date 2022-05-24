(function () {
  'use strict';

  angular
    .module('core.company')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 1,
      roles: ['company'],
      class: 'icon fa fa-home',
      title: 'ダッシュボード',
      state: 'company.home',
      parrent_state: 'company.home'
    });
  }
}());
