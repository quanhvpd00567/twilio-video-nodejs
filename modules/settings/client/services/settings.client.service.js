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
    this.listPPSSetting = function (condition) {
      return $http.post('/api/settings/pps/paging', { condition: condition }, {});
    };
    this.addOrUpdateConfigSet = function (configSet) {
      return $http.post('/api/settings/config-set/add-or-update', { configSet: configSet });
    };
    this.deleteConfigSet = function (_id) {
      return $http.post('/api/settings/config-set/delete', { _id: _id });
    };

    this.listAPSSetting = function (condition) {
      return $http.post('/api/settings/aps/paging', { condition: condition }, {});
    };

    return this;
  }

}());
