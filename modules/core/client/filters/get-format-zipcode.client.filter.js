(function () {
  'use strict';
  angular.module('core').filter('format_zipcode', getFormatZipCode);

  getFormatZipCode.$inject = ['TranslationService', '$filter'];
  function getFormatZipCode(TranslationService, $filter) {
    return function (zipcode, isOriginal) {
      zipcode = zipcode || '';

      if (zipcode.length === 0) {
        return '';
      }

      if (zipcode.includes('-')) {
        return '〒' + zipcode;
      }

      if (zipcode.length > 3) {
        return '〒' + zipcode.substr(0, 3) + '-' + zipcode.substr(3, zipcode.length - 1);
      }

      return '〒' + zipcode;
    };
  }
}());
