(function () {
  'use strict';
  angular.module('core').directive('replaceNumber', function () {
    return {
      strict: 'A',
      require: '?ngModel',
      link: function (scope, element, attributes, ngModel) {
        element.bind('blur', function (e) {
          var value = ngModel.$viewValue + '';
          var str = jaconv
            .normalize(value)
            .toString()
            .replace(/[^\d.]/g, '');
          str = str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          ngModel.$setViewValue(str);
          ngModel.$render();
        });
      }
    };
  });
}());
