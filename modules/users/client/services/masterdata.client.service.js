(function () {
  'use strict';

  // Authentication service for user variables

  angular
    .module('users.services')
    .factory('Masterdata', Masterdata);

  Masterdata.$inject = ['$window'];

  function Masterdata($window) {
    var masterdata = { masterdata: $window.masterdata };
    return masterdata;
  }
}());
