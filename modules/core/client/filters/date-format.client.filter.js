(function () {
  'use strict';

  angular
    .module('core')
    .filter('LL', LL_format)
    .filter('LLL', LLL_format)
    .filter('LLLL', LLLL_format)
    .filter('dddd', dddd_format)
    .filter('format_datetime', format_datetime);

  function LL_format() {
    return function (time) {
      return moment(time).format('LL');
    };
  }
  function LLL_format() {
    return function (time) {
      return moment(time).format('LLL');
    };
  }
  function LLLL_format() {
    return function (time) {
      return moment(time).format('LLLL');
    };
  }
  function dddd_format() {
    return function (time) {
      return moment(time).format('dddd');
    };
  }
  function format_datetime() {
    return function (datetime, format) {
      return moment(datetime).format(format);
    };
  }
}());
