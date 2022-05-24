(function () {
  'use strict';
  angular.module('core')
    .directive('labelRole', labelRole);
  labelRole.$inject = [];

  function labelRole() {
    var directive = {
      restrict: 'E',
      scope: {
        role: '=',
        roles: '='
      },
      // remove label color of role
      // template: '<span class="label {{getClass()}}">{{getText()}}</span>',
      template: '<span>{{getText()}}</span>',
      link: function (scope) {
        scope.getText = function () {
          if (scope.role && scope.role[0]) {
            var role = _.find(scope.roles, function (obj) {
              return obj.id === scope.role[0];
            });
            return role.name;
          }
        };
        scope.getClass = function () {
          if (scope.role && scope.role[0]) {
            var role = _.find(scope.roles, function (obj) {
              return obj.id === scope.role[0];
            });
            return role.class;
          }
        };
      }
    };

    return directive;
  }
}());
