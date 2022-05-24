(function () {
  'use strict';

  angular.module('core')
    .directive('absNumber', function () {
      return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attrs, ctrl) {
          ctrl.$parsers.push(function (input) {
            if (!input) {
              return input;
            }

            var inputString = input.toString();
            var splitted = [];
            var char = '';

            if (inputString.indexOf(',') !== -1) {
              splitted = inputString.split(',');
              char = ',';
            } else if (inputString.indexOf('.') !== -1) {
              splitted = inputString.split('.');
              char = '.';
            }

            if (splitted && splitted.length > 0 && splitted[1].length > 4) {
              inputString = splitted[0] + char + splitted[1].slice(0, 4);
              var inputNumber = Number(inputString);
              ctrl.$setViewValue(inputNumber);
              ctrl.$render();
              return inputNumber;
            }

            var valueString = ctrl.$viewValue;
            if (valueString && typeof (valueString) === 'string') {
              var splittedValueString = [];
              if (inputString.indexOf(',') !== -1) {
                splittedValueString = valueString.split(',');
              } else if (inputString.indexOf('.') !== -1) {
                splittedValueString = valueString.split('.');
              }

              if (splittedValueString && splittedValueString.length > 0 && splittedValueString[1].length > 4 && splittedValueString[1][4] === '0') {
                inputString = splittedValueString[0] + char + splittedValueString[1].slice(0, 4);
                ctrl.$setViewValue(Number(inputString));
                ctrl.$render();
                return Number(inputString);
              }
            }

            return input;
          });
        }
      };
    });
}());
