(function () {
  'use strict';

  angular.module('core').directive('checkBirthDay', checkBirthDay);
  checkBirthDay.$inject = ['$window'];

  function checkBirthDay($window) {
    var directive = {
      require: 'ngModel',
      link: link
    };
    return directive;

    function link(scope, element, attrs, ngModel) {
      scope.$watch(function () {
        var value = attrs.value;
        var newDate = new Date(value);
        var today = new Date;
        if (value.split('/').length - 1 === 2) {
          if (Object.prototype.toString.call(newDate) === '[object Date]') {
            ngModel.$setValidity('birth_day_invaild', true);
            if (isNaN(newDate.getTime())) { // d.valueOf() could also work
              ngModel.$setValidity('birth_day_invaild', true);
            } else {
              ngModel.$setValidity('birth_day_invaild', !((newDate - today) > 0));
            }
          } else {
            ngModel.$setValidity('birth_day_invaild', true);
          }
        } else {
          ngModel.$setValidity('birth_day_invaild', true);
        }

      });
    }
  }
}());
