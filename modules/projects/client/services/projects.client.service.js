(function () {
  'use strict';

  angular
    .module('projects.municipality.services')
    .factory('ProjectsService', ProjectsService)
    .factory('ProjectsApi', ProjectsApi);

  ProjectsService.$inject = ['$resource'];

  function ProjectsService($resource) {
    var Project = $resource('/api/projects/:projectId', { projectId: '@_id' }, {
      update: { method: 'PUT' },
      send: { method: 'PATCH' }
    });

    angular.extend(Project.prototype, {
      createOrUpdate: function () {
        var project = this;
        return createOrUpdate(project);
      }
    });

    return Project;

    function createOrUpdate(project) {
      if (project._id) {
        return project.$update(onSuccess, onError);
      } else {
        return project.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(project) { }

      // Handle error response
      function onError(errorResponse) {
        var error = errorResponse.data;
        handleError(error);
      }
    }
    function handleError(error) {
      return false;
    }
  }

  ProjectsApi.$inject = ['$http'];
  function ProjectsApi($http) {
    this.list = function (condition) {
      return $http.post('/api/projects/paging', { condition: condition }, {});
    };
    this.create = function (data) {
      return $http.post('/api/projects/', data, {});
    };
    this.update = function (id, data) {
      return $http.put('/api/projects/' + id, data, {});
    };
    this.listOfMunicipality = function (condition, municipalityId) {
      return $http.post('/api/' + municipalityId + '/projects/paging', { condition: condition }, {});
    };
    this.getProjectsOfMunicipalityByProjectIds = function (municipalityId, projectIds, eventStart) {
      return $http.post('/api/' + municipalityId + '/projects', { projectIds: projectIds, eventStart: eventStart }, {});
    };
    this.applyProjects = function (municipalityId, event, projectIdsSelected, companyId) {
      return $http.post('/api/' + municipalityId + '/projects/apply', { event: event, projectIds: projectIdsSelected, companyId: companyId }, {});
    };
    this.export = function (condition) {
      return $http.get('/api/projects/export', { params: condition });
    };
    this.countNumberOfComprojects = function (id) {
      return $http.get('/api/projects/' + id + '/comprojects/count');
    };

    return this;
  }
}());
