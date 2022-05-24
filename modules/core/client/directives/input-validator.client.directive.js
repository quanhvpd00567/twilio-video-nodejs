(function () {
  'use strict';

  angular.module('core').directive('inputValidator', inputValidator);
  inputValidator.$inject = ['$window'];

  function inputValidator($window) {
    var directive = {
      require: 'ngModel',
      scope: {
        valMin: '=',
        valMax: '='
      },
      link: link
    };
    return directive;

    function link(scope, element, attrs, ngModel) {
      var validator = $window.validator;
      var type = attrs.inputValidator;
      // var validation = validator.split(',');
      var pattern;
      var URL = 'url';
      var EMAIL = 'email';
      var ALPHA = 'alpha';
      var ALPHA_NUMBER = 'alphanumeric';
      var INT = 'int';
      var FULL_DATETIME = 'fulldatetime';
      var DATE = 'date';
      var TIME = 'time';
      var KANA = 'kana';
      var ZIP = 'zip';
      var TEL = 'tel';
      var FLOAT = 'float';
      var FLOAT_DECIMAL = 'float_decimal';
      var MADE_DATE = 'made_date';
      var LATITUDE = 'latitude';
      var LONGITUDE = 'longitude';
      var URL_NOT_REQUIRED = 'url_not_required';
      var HIRAGANA = 'hiragana';
      var ONLYNUMBER = 'onlynumber';

      element.bind('blur', function (e) {
        var option = {};
        var min = scope.valMin;
        var max = scope.valMax;
        var value = ngModel.$viewValue + '';
        if ((!ngModel || !value) && type !== URL_NOT_REQUIRED) return;

        if (!value || value === 'null' || value === 'undefined') {
          ngModel.$setValidity(type, true);
          return;
        }

        switch (type) {
          case URL:
            ngModel.$setValidity(URL, validator.isURL(value));
            break;
          case EMAIL:
            ngModel.$setValidity(EMAIL, validator.isEmail(value));
            break;
          case ALPHA:
            ngModel.$setValidity(ALPHA, validator.isAlpha(value));
            break;
          case ALPHA_NUMBER:
            ngModel.$setValidity(ALPHA_NUMBER, validator.isAlphanumeric(value));
            break;
          case INT:
            if (min) option.min = parseInt(min, 10);
            if (max) option.max = parseInt(max, 10);

            ngModel.$setValidity(INT, validator.isInt(value, option));
            break;
          case FULL_DATETIME:
            pattern = /20\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]/;
            ngModel.$setValidity(FULL_DATETIME, validator.matches(value, pattern));

            break;
          case DATE:
            pattern = /20\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[1-2][0-9]|3[0-1])/;
            ngModel.$setValidity(DATE, validator.matches(value, pattern));
            break;
          case TIME:
            pattern = /(2[0-3]|[01][0-9]):[0-5][0-9]/;
            ngModel.$setValidity(TIME, validator.matches(value, pattern));
            break;
          case KANA:
            pattern = /^[\u30a0-\u30ffー\u3000]+$/;
            ngModel.$setValidity(KANA, validator.matches(value, pattern));
            break;
          case ZIP:
            pattern = /^\d{3}-\d{4}$|^\d{3}-\d{2}$|^\d{3}$/;
            ngModel.$setValidity(ZIP, validator.matches(value, pattern));
            break;
          case TEL:
            pattern = /^([0-9]{9,13}$)/;
            ngModel.$setValidity(TEL, validator.matches(value, pattern));
            break;
          case FLOAT:
            pattern = /^[\d.]+$/;
            ngModel.$setValidity(FLOAT, validator.matches(value, pattern));
            break;
          case FLOAT_DECIMAL:
            pattern = /^([0-9]\d*)(\.\d{1,9})?$/;
            ngModel.$setValidity(FLOAT_DECIMAL, validator.matches(value, pattern));
            break;
          case MADE_DATE:
            pattern = /20\d{2}\/(0[1-9]|1[0-2]|-)/;
            ngModel.$setValidity(MADE_DATE, validator.matches(value, pattern));
            break;
          case LATITUDE:
            pattern = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/;
            ngModel.$setValidity(LATITUDE, validator.matches(value, pattern));
            break;
          case LONGITUDE:
            pattern = /^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
            ngModel.$setValidity(LONGITUDE, validator.matches(value, pattern));
            break;
          case URL_NOT_REQUIRED:
            if (value && value !== '') {
              ngModel.$setValidity(URL_NOT_REQUIRED, validator.isURL(value));
            } else {
              ngModel.$setValidity(URL_NOT_REQUIRED, false);
            }
            break;
          case HIRAGANA:
            pattern = /^[ぁ-ん]+$/;
            ngModel.$setValidity(HIRAGANA, validator.matches(value, pattern));
            break;
          case ONLYNUMBER:
            pattern = /^(\d{1,}[-]\d{1,}[-]\d{1,})$/;
            ngModel.$setValidity(ONLYNUMBER, validator.matches(value, pattern));
            break;
          default:
            break;
        }
      });
    }
  }
}());
