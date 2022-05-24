(function () {
  'use strict';

  angular
    .module('companies.company')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the events module
  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      position: 4,
      roles: ['company'],
      class: 'fa fa-edit',
      title: '企業情報の編集',
      state: 'company.companies.edit',
      parrent_state: 'company.companies'
    });
  }
}());
