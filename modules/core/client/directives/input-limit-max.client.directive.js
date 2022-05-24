(function () {
  'use strict';

  angular
    .module('core')
    .directive('inputLimitMax', limitToMax);
  limitToMax.$inject = ['$window'];

  function limitToMax($window) {
    var directive = {
      require: 'ngModel',
      scope: {
        valMin: '=',
        valMax: '='
      },
      link: link
    };
    return directive;

    function link(scope, element, attributes, ngModel) {
      element.on('keydown keyup', function (e) {
        if (Number(element.val()) > Number(attributes.max) &&
          e.keyCode !== 46 // delete
          &&
          e.keyCode !== 8 // backspace
        ) {
          e.preventDefault();
          element.val(attributes.max);
        }
        if (Number(element.val()) < Number(attributes.min) &&
          e.keyCode !== 46 // delete
          &&
          e.keyCode !== 8 // backspace
        ) {
          e.preventDefault();
          element.val(attributes.min);
        }
      });
    }
  }
}());
