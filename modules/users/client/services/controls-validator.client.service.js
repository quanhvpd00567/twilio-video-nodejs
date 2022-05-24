(function () {
  'use strict';

  // PasswordValidator service used for testing the password strength
  angular
    .module('users.services')
    .factory('PasswordValidator', PasswordValidator)
    .factory('HalfsizeAlphamericValidator', HalfsizeAlphamericValidator);

  function PasswordValidator() {
    return {
      getResult: function (password) {
        var result = { errors: [] };
        if (password.length < 8 || password.length > 32) {
          result.errors.push('パスワードは８～３２の半角英数字を入力してください。');
        }
        if (password.length > 32) {
          result.errors.push('パスワードは３２文字以内入力してください。');
        }
        return result;
      }
    };
  }

  function HalfsizeAlphamericValidator() {
    return {
      validate: function (text) {
        var result = { errors: [] };
        text = (!text) ? '' : text;
        if (!text.match(/^[A-Za-z0-9]*$/)) {
          result.errors.push('この項目は半角英数字を入力してください。');
        }
        return result;
      }
    };
  }
}());
