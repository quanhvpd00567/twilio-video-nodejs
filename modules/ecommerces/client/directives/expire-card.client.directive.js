(function () {
  'use strict';

  angular.module('core').directive('expireCard', expireCard);
  expireCard.$inject = ['$window'];

  function expireCard($window) {
    var directive = {
      require: 'ngModel',
      link: link
    };
    return directive;

    function link(scope, element, attrs, ngModel) {
      var type = attrs.expireCard;
      scope.$watch(function () {
        var value = ngModel.$viewValue;
        if (type === 'year' && value) {
          var year = value;
          var month = attrs.month;
          var today = new Date;
          if (month) {
            var monthYearCard = new Date('01/' + month + '/20' + year);
            var dateCurent = new Date('01/' + today.getMonth() + '/' + today.getFullYear());
            ngModel.$setValidity('year', !((monthYearCard - dateCurent) < 0));
            return;
          }
        }

        if (type === 'month' && value) {
          var month1 = value;
          var year1 = attrs.year;
          var today1 = new Date;
          if (month1 && (Number(month1) > 12 || Number(month1) < 1)) {
            ngModel.$setValidity('pattern', !(Number(month1) > 12 || Number(month1) < 1));
            return;
          }

          if (year1) {
            var monthYearCard1 = new Date('01/' + month1 + '/20' + year1);
            var dateCurent1 = new Date('01/' + today1.getMonth() + '/' + today1.getFullYear());
            ngModel.$setValidity('month', !((monthYearCard1 - dateCurent1) < 0));
            return;
          }
        }
      });
    }
  }
}());
