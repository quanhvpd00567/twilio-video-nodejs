(function () {
  'use strict';

  angular
    .module('projects.municipality.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.projects', {
        abstract: true,
        url: '/projects',
        template: '<ui-view/>'
      })
      .state('municipality.projects.list', {
        url: '?{municipalityId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/projects/client/views/municipality/project-municipality-list.client.view.html',
        controller: 'ProjectMunicipalityListController',
        controllerAs: 'vm',
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: 'プロジェクト一覧'
        }
      })
      .state('municipality.projects.create', {
        url: '/create?{projectIdCloned, municipalityId}&{isNeedAuthorize: string}',
        templateUrl: '/modules/projects/client/views/municipality/project-municipality-form.client.view.html',
        controller: 'ProjectMunicipalityFormController',
        controllerAs: 'vm',
        resolve: {
          projectResolve: newProject
        },
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: 'プロジェクト登録'
        }
      })
      .state('municipality.projects.edit', {
        url: '/:projectId/edit?{municipalityId: string}&{requestItemId: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/projects/client/views/municipality/project-municipality-form.client.view.html',
        controller: 'ProjectMunicipalityFormController',
        controllerAs: 'vm',
        resolve: {
          projectResolve: getProject
        },
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: 'プロジェクト編集'
        }
      })
      .state('municipality.projects.detail', {
        url: '/:projectId/detail?{municipalityId: string}&{requestItemId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/projects/client/views/municipality/project-municipality-detail.client.view.html',
        controller: 'ProjectMunicipalityDetailController',
        controllerAs: 'vm',
        resolve: {
          projectResolve: getProject
        },
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: 'プロジェクト詳細'
        }
      });

    getProject.$inject = ['$stateParams', 'ProjectsService'];
    function getProject($stateParams, ProjectsService) {
      return ProjectsService.get({
        projectId: $stateParams.projectId
      }).$promise;
    }

    newProject.$inject = ['$stateParams', 'ProjectsService'];
    function newProject($stateParams, ProjectsService) {
      if ($stateParams.projectIdCloned) {
        return ProjectsService.get({
          projectId: $stateParams.projectIdCloned
        }).$promise;
      }

      return new ProjectsService();
    }
  }
}());
