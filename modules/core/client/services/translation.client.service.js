(function () {
  'use strict';

  angular.module('core').factory('TranslationService', TranslationService);

  function TranslationService($window) {
    this.data = $window.translatedata;
    this.translate = translate;

    function translate(value) {
      var self = this;
      if (self.data) {
        return self.data[value];
      } else {
        return '';
      }
    }

    return this;
  }
}());
