(function () {
  'use strict';

  angular
    .module('projects.company')
    .controller('EventProjectSearchController', EventProjectSearchController);

  EventProjectSearchController.$inject = ['$scope', 'ProjectsApi', '$filter', 'MunicipalitiesApi', 'EventsHelper', '$state'];

  function EventProjectSearchController($scope, ProjectsApi, $filter, MunicipalitiesApi, EventsHelper, $state) {
    var vm = this;
    vm.conditionMunicipalities = {};
    vm.conditionProjects = {};

    vm.isSearchedProjects = false;
    vm.isSearchedMunicipalities = false;

    var municipalityIdOrigin = null;

    vm.municipalities = [];
    vm.projectIdsSelected = [];
    vm.searchMunicipalities = handleSearchMunicipalities;
    vm.master = $scope.masterdata;
    vm.roles = vm.master.company_roles;

    onCreate();

    function onCreate() {
      vm.companyId = $state.params.companyId;
      if ($scope.isAdminOrSubAdmin && !vm.companyId) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }
      prepareCondition();
    }

    function prepareCondition() {
      vm.dateOptionsStart = { showWeeks: false, minDate: null, maxDate: null };
      vm.dateOptionsEnd = { showWeeks: false, minDate: null, maxDate: null };

      resetProjectIdSelected();
      prepareConditionSearchForProjects();
      prepareConditionSearchForMunicipalities();
    }

    function prepareConditionSearchForProjects() {
      vm.isSearchedProjects = false;
      vm.conditionProjects = $scope.prepareCondition('projects_search', true);
      vm.conditionProjects.sort_column = 'start';
      vm.conditionProjects.sort_direction = '-';
    }

    function prepareConditionSearchForMunicipalities() {
      vm.isSearchedMunicipalities = false;
      vm.municipalities = [];
      vm.conditionMunicipalities = $scope.prepareCondition('municipalities_search', true);
      vm.conditionMunicipalities.sort_column = 'name';
      vm.conditionMunicipalities.sort_direction = '-';
    }

    function handleSearchMunicipalities() {
      if (new Date(vm.conditionMunicipalities.start) < new Date()) {
        var message = $filter('translate')('event.project_search.controller.message.error_start_less_today');
        $scope.handleShowToast(message, true);
        return;
      }

      if (new Date(vm.conditionMunicipalities.start).getTime() >= new Date(vm.conditionMunicipalities.end).getTime()) {
        var message1 = $filter('translate')('event.project_search.controller.message.invalid_start_end');
        $scope.handleShowToast(message1, true);
        return;
      }

      resetProjectIdSelected();
      $scope.handleShowWaiting();
      if (vm.companyId) {
        vm.conditionMunicipalities.companyId = vm.companyId;
      }
      MunicipalitiesApi.getListMunicipalitiesHasProjectsInPeriod(vm.conditionMunicipalities)
        .success(function (res) {
          vm.isSearchedMunicipalities = true;
          $scope.handleCloseWaiting();
          vm.municipalities = res.docs;
          vm.conditionMunicipalities.count = res.docs.length;
          vm.conditionMunicipalities.page = res.page;
          vm.conditionMunicipalities.total = res.totalDocs;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = (error && error.message) || (error && error.data && error.data.message) || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    vm.handleSelectMunicipality = function (municipality) {
      prepareConditionSearchForProjects();
      vm.conditionProjects.start = vm.conditionMunicipalities.start;
      vm.conditionProjects.end = vm.conditionMunicipalities.end;
      vm.conditionProjects.municipalityId = municipality._id;
      vm.conditionProjects.companyId = vm.companyId;
      vm.conditionProjects.municipalityName = municipality.name;
      handleSearchProjects();
    };

    vm.reselectMunicipality = function () {
      vm.isSearchedProjects = false;
      vm.projects = [];
    };

    function handleSearchProjects() {
      if (!vm.conditionProjects.start || !vm.conditionProjects.end || !vm.conditionProjects.municipalityId) {
        return;
      }

      // Choose other municipality
      if (municipalityIdOrigin !== vm.conditionProjects.municipalityId) {
        vm.projectIdsSelected = [];
      }
      municipalityIdOrigin = vm.conditionProjects.municipalityId;

      vm.isSearchedProjects = true;
      $scope.handleShowWaiting();
      ProjectsApi.listOfMunicipality(vm.conditionProjects, vm.conditionProjects.municipalityId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.projects = res.docs;
          vm.conditionProjects.count = res.docs.length;
          vm.conditionProjects.page = res.page;
          vm.conditionProjects.total = res.totalDocs;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    /** start handle search, sort & paging */
    vm.handlePageChangedForMunicipalities = function () {
      handleSearchMunicipalities();
    };
    vm.handleSortChangedForMunicipalities = function (sort_column) {
      vm.conditionMunicipalities = $scope.handleSortChanged(vm.conditionMunicipalities, sort_column);
      handleSearchMunicipalities();
    };
    /** end handle search, sort & paging */

    /** start handle search, sort & paging */
    vm.handlePageChangedForProjects = function () {
      handleSearchProjects();
    };
    /** end handle search, sort & paging */

    vm.onChangeStart = function () {
      vm.isSearchedMunicipalities = false;
      vm.municipalities = [];
    };

    vm.onChangeEnd = function () {
      if (vm.conditionMunicipalities.end) {
        var hour = new Date(vm.conditionMunicipalities.end).getHours();
        var min = new Date(vm.conditionMunicipalities.end).getMinutes();
        if (hour === 0 && min === 0) {
          vm.conditionMunicipalities.end = moment(vm.conditionMunicipalities.end).hour(23).minute(59).second(59).toDate();
        }
      }
      vm.isSearchedMunicipalities = false;
      vm.municipalities = [];
    };

    vm.onSelect = function (projectId) {
      if (vm.projectIdsSelected.includes(projectId)) {
        var index = vm.projectIdsSelected.indexOf(projectId);
        if (index > -1) {
          vm.projectIdsSelected.splice(index, 1);
        }
      } else {
        vm.projectIdsSelected.push(projectId);
      }
    };

    vm.apply = function () {
      if (vm.projectIdsSelected.length === 0) {
        return;
      }

      var data = { municipalityId: vm.conditionProjects.municipalityId, projectIdsSelected: vm.projectIdsSelected, start: vm.conditionProjects.start, end: vm.conditionProjects.end };
      EventsHelper.setTmpApplyProjectsData(data);
      $state.go('company.events.projects_apply', { companyId: vm.companyId });
    };

    vm.reset = function () {
      prepareCondition();
    };

    function resetProjectIdSelected() {
      vm.projectIdsSelected = [];
      EventsHelper.clearTmpApplyProjectsData();
    }
  }
}());
