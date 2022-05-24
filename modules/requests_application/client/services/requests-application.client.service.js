(function () {
  'use strict';

  angular
    .module('requests_application.services')
    .factory('RequestsApplicationApi', RequestsApplicationApi);

  RequestsApplicationApi.$inject = ['$http'];
  function RequestsApplicationApi($http) {
    this.list = function (condition) {
      return $http.post('/api/requests-items', { condition: condition }, {});
    };
    this.get = function (requestItemId) {
      return $http.get('/api/requests-items/' + requestItemId, {});
    };
    this.update = function (requestItemId, data) {
      return $http.post('/api/requests-items/' + requestItemId, data);
    };
    this.submit = function (data) {
      return $http.post('/api/submit-application', data);
    };
    this.resubmit = function (data) {
      return $http.post('/api/resubmit-application', data);
    };
    this.removeRequestItem = function (data) {
      return $http.post('/api/remove-request-item-application', data);
    };
    this.removeRequest = function (data) {
      return $http.post('/api/remove-request-application', data);
    };

    return this;
  }
}());
