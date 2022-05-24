(function () {
  'use strict';

  angular
    .module('events.company')
    .controller('EventMunicipalityDetailController', EventMunicipalityDetailController);

  EventMunicipalityDetailController.$inject = ['$scope', '$state', '$filter', 'EventsApi', '$stateParams'];

  function EventMunicipalityDetailController($scope, $state, $filter, EventsApi, $stateParams) {
    var vm = this;
    vm.event = {};
    vm.eventId = $stateParams.eventId;

    onCreate();

    function onCreate() {
      if (!vm.eventId) {
        $state.go('company.events.list');
      }
      prepareCondition();
      handleSearch(true);
    }

    function prepareCondition() {
      vm.condition = $scope.prepareCondition('event_comprojects_munic', true);
      vm.condition.sort_column = 'created';
      vm.condition.sort_direction = '-';
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      EventsApi.pagingComprojects(vm.condition, vm.eventId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.docs = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('event_comprojects_munic', vm.condition);
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    /** start handle search, sort & paging */
    vm.handleConditionChange = function () {
      vm.isChanged = true;
    };
    vm.handleConditionChanged = function (changed, key, old) {
      if (!changed && (key === 'end_date')) {
        if (old) {
          var valNew = moment(vm.condition[key]);
          var valOld = moment(old);
          if (valNew.format('YYYYMMDD') !== valOld.format('YYYYMMDD')) {
            vm.condition[key] = valNew.hour(23).minute(59).second(59).toDate();
          }
        } else {
          vm.condition[key] = moment(vm.condition[key]).hour(23).minute(59).second(59).toDate();
        }
      }
      if (changed || vm.isChanged) {
        vm.isChanged = false;
        vm.condition.page = 1;
        handleSearch();
      }
    };

    vm.handlePageChanged = function () {
      handleSearch();
    };
    vm.handleClearCondition = function () {
      prepareCondition(true);
      handleSearch();
    };
    vm.handleSortChanged = function (sort_column) {
      vm.condition = $scope.handleSortChanged(vm.condition, sort_column);
      handleSearch();
    };

    vm.handlePageChanged = function () {
      handleSearch();
    };

    vm.concatProjectNames = function (projectNames) {
      var string = '';
      _.forEach(projectNames, function (name, index) {
        string += name;
        if (index !== (projectNames.length - 1)) {
          string += '・';
        }
      });

      return string;
    };
  }
}());
