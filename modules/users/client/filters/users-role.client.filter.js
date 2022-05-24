(function () {
  'use strict';

  angular
    .module('users.admin')
    .filter('RoleFilter', RoleFilter);

  RoleFilter.$inject = [];

  function RoleFilter() {
    return function (roles) {
      if (_.includes(roles, 'admin')) return '管理者';
      return '顧客';
    };
  }
}());
