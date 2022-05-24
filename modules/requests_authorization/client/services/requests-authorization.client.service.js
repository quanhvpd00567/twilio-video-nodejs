(function () {
  'use strict';

  angular
    .module('requests_authorization.services')
    .factory('RequestsAuthorizationApi', RequestsAuthorizationApi);

  RequestsAuthorizationApi.$inject = ['$http'];
  function RequestsAuthorizationApi($http) {
    this.list = function (condition) {
      return $http.post('/api/requests', { condition: condition }, {});
    };

    this.reject = function (requestId, rejectReason) {
      return $http.post('/api/requests-authorization/' + requestId + '/reject', { rejectReason: rejectReason });
    };
    this.approve = function (requestId) {
      return $http.post('/api/requests-authorization/' + requestId + '/approve');
    };
    this.delete = function (requestId) {
      return $http.post('/api/requests-authorization/' + requestId + '/delete');
    };

    return this;
  }
}());
