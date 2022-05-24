(function () {
  'use strict';

  angular.module('ecommerces').directive('sameInput', sameInput);
  sameInput.$inject = ['$window'];

  function sameInput($window) {
    var directive = {
      require: 'ngModel',
      link: link
    };
    return directive;

    function link(scope, element, attrs, ngModel) {
      var validator = $window.validator;
      scope.$watch(function () {
        // if(!validator.isEmail(ngModel.$viewValue)) {

        // }
        if (ngModel.$viewValue) {
          ngModel.$setValidity('email', validator.isEmail(ngModel.$viewValue));
        }
        ngModel.$setValidity('email-not-same', ngModel.$viewValue === attrs.email);
      });
    }
  }
}());
