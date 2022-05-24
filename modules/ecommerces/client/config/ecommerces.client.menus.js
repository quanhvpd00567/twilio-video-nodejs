(function () {
  'use strict';

  angular
    .module('ecommerces.company')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  // Configuring the ecommerces module
  function menuConfig(menuService) {}
}());
