(function () {
  'use strict';

  angular
    .module('core')
    .directive('uniqueValidator', uniqueValidator);
  uniqueValidator.$inject = ['ValidationApi'];

  function uniqueValidator(ValidationApi) {
    var directive = {
      require: 'ngModel',
      scope: {
        params: '='
      },
      link: link
    };
    return directive;

    function link(scope, element, attrs, ngModel) {
      element.bind('blur', function (e) {
        if (!ngModel || !element.val()) return;
        ValidationApi.unique(scope.params)
          .then(function (res) {
            ngModel.$setValidity('unique', res.data.unique);
          }, function () {
            ngModel.$setValidity('unique', true);
          });
      });
    }
  }
}());
