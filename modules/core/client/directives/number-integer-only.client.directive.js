(function () {
  'use strict';

  angular.module('core')
    .directive('numberIntegerOnly', function () {
      return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attrs, ctrl) {
          ctrl.$parsers.push(function (input) {
            var min = Number(attrs.min);
            if (!input) {

              return input;
            }

            var inputString = input.toString().replace(/[^0-9]/g, '');
            var inputNumber = Number(inputString);
            var max = Number(attrs.max);

            if (inputString !== input) {
              ctrl.$setViewValue(inputNumber);
              ctrl.$render();
            }

            if (min && inputNumber < min) {
              inputNumber = min;
              ctrl.$setViewValue(inputNumber);
              ctrl.$render();
            }
            if (max && inputNumber > max) {
              inputNumber = max;
              ctrl.$setViewValue(inputNumber);
              ctrl.$render();
            }

            return inputNumber;
          });
        }
      };
    });

}());
