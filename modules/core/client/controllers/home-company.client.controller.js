(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeCompanyController', HomeCompanyController);

  HomeCompanyController.$inject = ['$scope', 'Authentication', 'UsersApi', '$filter', 'EventsApi'];
  function HomeCompanyController($scope, Authentication, UsersApi, $filter, EventsApi) {
    var vm = this;

    onCreate();

    function onCreate() {
      handleSearchForEventsOpening();

      prepareConditionForEventsFinished(true);
      handleSearchForEventsFinished(true);
    }

    function handleSearchForEventsOpening() {
      $scope.handleShowWaiting();
      EventsApi.getDataOfEventOpeningForHome()
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.eventsOpening = res;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    // events finished
    function prepareConditionForEventsFinished(clear) {
      vm.conditionForEventsFinished = $scope.prepareCondition('events_finished_home', clear);
      vm.conditionForEventsFinished.sort_column = 'created';
      vm.conditionForEventsFinished.sort_direction = '-';
      vm.conditionForEventsFinished.status = $scope.masterdata.EVENT_STATUS.FINISHED;
    }

    function handleSearchForEventsFinished(isShowingLoading) {
      if (!isShowingLoading) {
        $scope.handleShowWaiting();
      }
      EventsApi.pagingForHome(vm.conditionForEventsFinished)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.eventsFinished = res.docs;
          vm.conditionForEventsFinished.count = res.docs.length;
          vm.conditionForEventsFinished.page = res.page;
          vm.conditionForEventsFinished.total = res.totalDocs;
          $scope.conditionFactoryUpdate('events_finished_home', vm.conditionForEventsFinished);
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }
    vm.handlePageChanged = function () {
      handleSearchForEventsFinished();
    };
    vm.handleClearCondition = function () {
      prepareConditionForEventsFinished(true);
      handleSearchForEventsFinished();
    };
    vm.handleSortChanged = function (sort_column) {
      vm.conditionForEventsFinished = $scope.handleSortChanged(vm.conditionForEventsFinished, sort_column);
      handleSearchForEventsFinished();
    };
  }
}());
