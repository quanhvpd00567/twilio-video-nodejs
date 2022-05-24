(function () {
  'use strict';

  angular.module('core').directive('phoneValidator', phoneValidator);
  phoneValidator.$inject = ['$window'];

  function phoneValidator($window) {
    var directive = {
      require: 'ngModel',
      link: link
    };
    return directive;

    function link(scope, element, attrs, ngModel) {
      var validator = $window.validator;
      scope.$watch(function () {
        var value = ngModel.$viewValue;
        if (value) {
          var pattern = /^[\d-]+$/;
          if (!validator.matches(value, pattern)) {
            return ngModel.$setValidity('onlynumber', false);
          }
          ngModel.$setValidity('onlynumber', true);

          if (!value.includes('-')) {
            return ngModel.$setValidity('not_has-', false);
          }
          ngModel.$setValidity('not_has-', true);

          pattern = /^(\d{1,}[-]\d{1,}[-]\d{1,})$/;
          if (!validator.matches(value, pattern)) {
            return ngModel.$setValidity('format_phone', false);
          }

          ngModel.$setValidity('format_phone', true);
        }
      });
    }
  }
}());
