(function () {
  'use strict';
  angular.module('core').filter('format_step', getFormatStep);

  getFormatStep.$inject = ['TranslationService', '$filter'];
  function getFormatStep(TranslationService, $filter) {
    return function (value) {
      if (!value) {
        return 0 + TranslationService.translate('common.label.unit.step');
      }

      value = Math.round(value);
      return $filter('number')(value) + TranslationService.translate('common.label.unit.step');
    };
  }
}());
