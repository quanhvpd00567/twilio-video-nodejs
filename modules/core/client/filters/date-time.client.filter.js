(function () {
  'use strict';
  angular.module('core').filter('dateTimeFormat', function () {
    return function (input) {
      if (input) {
        var date = moment(input);
        return date.format('YYYY年MM月DD日 HH:mm');
      } else {
        return '';
      }
    };
  });
  // QuangTNH-Add date Format --START
  angular.module('core').filter('dateFormat', function () {
    return function (input) {
      if (input) {
        var date = moment(input);
        return date.format('ll');
      } else {
        return '';
      }
    };
  });
  // ANHTUAN-Add date Format --START
  angular.module('core').filter('formatYearMonth', function () {
    return function (input) {
      if (input) {
        var date = moment(input);
        return date.format('YYYY年MM月');
      } else {
        return '';
      }
    };
  });
  // ANHTUAN-Add date Format --START
  angular.module('core').filter('formatYearMonthDay', function () {
    return function (input) {
      if (input) {
        // input: 2021/10/18
        input = input.replace('/', '年');
        input = input.replace('/', '月');
        input = input + '日';
        return input;
      } else {
        return '';
      }
    };
  });
  // QuangTNH-Add date Format --END
  angular.module('core').filter('dateTimeNormal', function () {
    return function (input) {
      if (input) {
        var date = moment(input);
        return date.format('YYYY/MM/DD HH:mm');
      } else {
        return '';
      }
    };
  });
  angular.module('core').filter('dateNormal', function () {
    return function (input) {
      if (input) {
        var date = moment(input);
        return date.format('YYYY/MM/DD');
      } else {
        return '';
      }
    };
  });
}());
