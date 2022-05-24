(function () {
  'use strict';

  angular
    .module('com_projects.admin.services')
    .factory('ComProjectApi', ComProjectApi);

  ComProjectApi.$inject = ['$http'];
  function ComProjectApi($http) {
    // Get list employee belong to company
    this.list = function (conditions) {
      return $http.get('/api/com-projects', { params: conditions });
    };

    // // Get list subsidiaries belong to company
    this.detail = function (id) {
      return $http.get('/api/com-projects/' + id);
    };

    this.getListPaticipents = function (id, conditions) {
      return $http.get('/api/com-projects/paticipants/' + id, { params: conditions });
    };

    this.updateById = function (id, body) {
      return $http.put('/api/com-projects/' + id, body);
    };

    this.exportParticipant = function (id, conditions) {
      return $http.get('/api/com-projects/paticipants/' + id + '/export', { params: conditions });
    };

    this.export = function (conditions) {
      return $http.get('/api/com-projects/export', { params: conditions });
    };

    return this;
  }
}());
