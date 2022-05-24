(function () {
  'use strict';

  angular
    .module('requests_registration.admin.services')
    .factory('RequestRegistrationApi', RequestRegistrationApi);

  RequestRegistrationApi.$inject = ['$http'];
  function RequestRegistrationApi($http) {
    this.list = function (condition) {
      return $http.get('/api/requests-registration', { params: condition });
    };

    this.checkPermissionRequest = function (data) {
      return $http.post('/api/check-permission-request', data, {});
    };

    return this;
  }
}());
