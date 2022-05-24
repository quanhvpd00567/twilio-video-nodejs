(function () {
  'use strict';
  angular.module('core').filter('format_person', getFormatPerson);

  getFormatPerson.$inject = ['TranslationService', '$filter'];
  function getFormatPerson(TranslationService, $filter) {
    return function (number) {
      if (!number) {
        return 0 + TranslationService.translate('common.label.unit.person');
      }

      return $filter('number')(number) + TranslationService.translate('common.label.unit.person');
    };
  }
}());
