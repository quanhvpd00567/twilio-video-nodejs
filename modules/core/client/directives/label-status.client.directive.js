(function () {
  'use strict';
  angular.module('core')
    .directive('labelStatus', labelStatus);
  labelStatus.$inject = [];

  function labelStatus() {
    var directive = {
      restrict: 'E',
      scope: {
        item: '=',
        list: '='
      },
      template: '<span class="label {{getClass()}}">{{getText()}}</span>',
      link: function (scope) {
        scope.getText = function () {
          if (typeof scope.item !== 'undefined') {
            var item = _.find(scope.list, function (obj) {
              return obj.id === scope.item;
            });
            return item.name;
          }
        };
        scope.getClass = function () {
          if (typeof scope.item !== 'undefined') {
            var item = _.find(scope.list, function (obj) {
              return obj.id === scope.item;
            });
            return item.class;
          }
        };
      }
    };

    return directive;
  }
}());
