(function () {
  'use strict';
  angular.module('core').filter('translate', translate);
  translate.$inject = ['TranslationService'];
  function translate(TranslationService) {
    return function (input) {
      if (input) {
        return TranslationService.translate(input);
      } else {
        return '';
      }
    };
  }
}());
