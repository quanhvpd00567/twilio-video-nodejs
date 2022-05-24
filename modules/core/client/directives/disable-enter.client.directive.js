(function () {
  'use strict';
  angular.module('core').directive('disableEnter', function () {
    return {
      strict: 'A',
      require: '?ngModel',
      link: function (scope, element, attributes, ngModel) {
        element.keypress(function (e) {
          if (e.which === 13) {
            return false;
          }
        });
      }
    };
  });
}());
