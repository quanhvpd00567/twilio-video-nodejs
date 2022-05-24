(function () {
  'use strict';

  angular
    .module('core')
    .factory('ValidationApi', ValidationApi);

  ValidationApi.$inject = ['$http'];
  function ValidationApi($http) {
    this.unique = function (params) {
      return $http.post('/api/validation/unique', { params: params }, {});
    };

    return this;
  }
}());
