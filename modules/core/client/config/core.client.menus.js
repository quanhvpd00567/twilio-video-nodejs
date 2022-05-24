(function () {
  'use strict';

  angular
    .module('core')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    menuService.addMenu('account', {
      roles: ['user']
    });

    // menuService.addSubMenuItem('account', 'settings', {
    //   class: 'fa fa-user fa-fw',
    //   title: 'プロファイル編集',
    //   state: 'settings.profile'
    // });

    // menuService.addSubMenuItem('account', 'settings', {
    //   class: 'fa fa-gear fa-fw',
    //   title: 'パスワード変更',
    //   state: 'settings.password'
    // });
  }
}());
