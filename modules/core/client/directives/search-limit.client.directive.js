(function () {
  'use strict';

  angular.module('core')
    .directive('searchLimit', function () {
      return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attrs, ctrl) {
          ctrl.$parsers.push(function (input) {
            var inputNumber = 1;
            if (input === undefined || input === '' || !Number(input)) {
              ctrl.$setViewValue(inputNumber);
              ctrl.$render();
              return inputNumber;
            }

            inputNumber = input.toString().replace(/[^0-9]/g, '');
            if (inputNumber !== input) {
              ctrl.$setViewValue(inputNumber);
              ctrl.$render();
            }
            if (inputNumber > 1000) {
              inputNumber = 1000;
              ctrl.$setViewValue(inputNumber);
              ctrl.$render();
            }
            return inputNumber;
          });
        }
      };
    });

}());
