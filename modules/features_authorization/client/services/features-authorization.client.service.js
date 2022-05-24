(function () {
  'use strict';

  angular
    .module('features_authorization.services')
    .factory('FeaturesAuthorizationApi', FeaturesAuthorizationApi);

  FeaturesAuthorizationApi.$inject = ['$http'];
  function FeaturesAuthorizationApi($http) {
    this.get = function () {
      return $http.get('/api/features-authorization');
    };
    this.update = function (data) {
      return $http.post('/api/features-authorization', data);
    };

    return this;
  }
}());
