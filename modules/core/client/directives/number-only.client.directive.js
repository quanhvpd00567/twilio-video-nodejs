(function () {
  'use strict';

  angular.module('core')
    .directive('numberOnly', function () {
      return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attrs, ctrl) {
          ctrl.$parsers.push(function (input) {
            if (!input) {
              return;
            }

            var inputNumber = input.toString().replace(/[^0-9.]/g, '');
            if (inputNumber !== input) {
              ctrl.$setViewValue(inputNumber);
              ctrl.$render();
            }

            return inputNumber;
          });
        }
      };
    });

}());
