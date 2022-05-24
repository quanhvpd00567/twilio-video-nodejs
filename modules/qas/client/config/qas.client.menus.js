(function () {
  'use strict';

  angular
    .module('qas.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the qas module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 20,
      roles: ['admin', 'sub_admin'],
      class: 'fa fa-question-circle',
      title: 'Q&A管理',
      state: 'admin.qas.list',
      parrent_state: 'admin.qas'
    });
  }
}());
