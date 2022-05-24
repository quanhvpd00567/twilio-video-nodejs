(function () {
  'use strict';

  angular
    .module('credits.admin')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the Credits module
  function menuConfig(menuService) {
    // menuService.addMenuItem('topbar', {
    //   position: 13,
    //   roles: ['admin'],
    //   class: 'fa fa-credit-card',
    //   title: 'Test-CreditCard',
    //   state: 'credits.form',
    //   parrent_state: 'credits'
    // });
  }
}());
