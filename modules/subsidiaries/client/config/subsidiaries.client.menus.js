(function () {
  'use strict';

  angular
    .module('subsidiaries.company')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 5,
      roles: ['company'],
      class: 'fa fa-building-o',
      title: '子会社管理',
      state: 'company.subsidiaries.list',
      parrent_state: 'company.subsidiaries'
    });
  }
}());
