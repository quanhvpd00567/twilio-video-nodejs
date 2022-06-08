(function () {
  'use strict';

  angular
    .module('settings.admin.services')
    .factory('settingsApi', settingsApi);

  settingsApi.$inject = ['$http'];
  function settingsApi($http) {
    this.get = function () {
      return $http.get('/api/settings/config', {}, {});
    };
    this.update = function (setting) {
      return $http.put('/api/settings/config', { setting: setting }, {});
    };
    this.pushVersion = function (os) {
      return $http.post('/api/settings/pushVersion', os, {});
    };
    this.getInfo = function (os) {
      return $http.get('/api/info');
    };

    return this;
  }

}());
