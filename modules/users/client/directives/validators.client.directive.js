(function () {
  'use strict';

  angular
    .module('users')
    .directive('halfsizeAlphameric', halfsizeAlphameric)
    .directive('passwordValidator', passwordValidator)
    .directive('maxlengthValidator', maxlengthValidator)
    .directive('lengthValidator', lengthValidator);

  passwordValidator.$inject = ['PasswordValidator'];

  function passwordValidator(PasswordValidator) {
    var directive = {
      require: 'ngModel',
      link: link
    };

    return directive;

    function link(scope, element, attrs, ngModel) {
      ngModel.$validators.requirements = function (password) {
        var status = true;
        if (password) {
          var result = PasswordValidator.getResult(password);

          if (result.errors.length) {
            scope.passwordErrors = result.errors;
            status = false;
          } else {
            scope.passwordErrors = [];
            status = true;
          }
        }
        return status;
      };
    }
  }

  function halfsizeAlphameric() {
    var directive = {
      require: 'ngModel',
      link: link
    };

    return directive;

    function link(scope, element, attrs, ngModel) {
      scope.$watch(function () {
        var combined;
        if (ngModel) {
          combined = ngModel;
        }
        return combined;
      }, function (value) {
        if (value) {
          ngModel.$validators.halfsizeAlphameric = function (text) {
            text = (!text) ? '' : text;
            if (text.match(/^[A-Za-z0-9]*$/)) {
              return true;
            } else {
              return false;
            }
          };
        }
      });
    }
  }

  function maxlengthValidator() {
    var directive = {
      require: 'ngModel',
      scope: { maxlengthValidator: '=' },
      link: link
    };

    return directive;

    function link(scope, element, attrs, ngModel) {
      scope.$watch(function () {
        var combined;
        if (scope.maxlengthValidator) {
          combined = scope.maxlengthValidator;
        }
        return combined;
      }, function (value) {
        if (value) {
          ngModel.$validators.maxLength = function (text) {
            text = (!text) ? '' : text;
            if (text.length > value) {
              return false;
            }
            return true;
          };
        }
      });
    }
  }

  function lengthValidator() {
    var directive = {
      require: 'ngModel',
      scope: { lengthValidator: '=' },
      link: link
    };

    return directive;

    function link(scope, element, attrs, ngModel) {
      scope.$watch(function () {
        var combined;
        if (scope.lengthValidator) {
          combined = scope.lengthValidator;
        }
        return combined;
      }, function (value) {
        if (value) {
          ngModel.$validators.length = function (text) {
            text = (!text) ? '' : text;
            if (text.length !== value) {
              return false;
            }
            return true;
          };
        }
      });
    }
  }
}());
