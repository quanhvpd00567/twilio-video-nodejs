(function () {
  'use strict';

  angular
    .module('events.company')
    .controller('ComProjectDetailCompanyController', ComProjectDetailCompanyController);

  ComProjectDetailCompanyController.$inject = ['$scope', '$stateParams', 'ComProjectApi', '$filter'];

  function ComProjectDetailCompanyController($scope, $stateParams, ComProjectApi, $filter) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.eventId = $stateParams.eventId;
    onCreate();

    function onCreate() {
      getComprojectDetail();
      prepareCondition(true);
      handleSearch(true);
    }

    function getComprojectDetail() {
      $scope.handleShowWaiting();
      ComProjectApi.detail($stateParams.comProjectId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.com_project = res;
          $scope.handleCloseWaiting();
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      ComProjectApi.getListPaticipents($stateParams.comProjectId, vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.paticipants = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('paticipants', vm.condition);
          $scope.handleCloseWaiting();
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

    vm.handleConditionChanged = function (changed) {
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

    /** end handle search, sort & paging */

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('paticipants', clear);
    }

    vm.export = function () {
      $scope.handleShowConfirm({
        message: $filter('translate')('common.excel.export.confirm')
      }, function () {
        ComProjectApi.exportParticipant($stateParams.comProjectId, vm.condition).success(function (res) {
          $scope.handleCloseWaiting();
          window.open('/' + res.url, '_newtab');
        }).error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.excel.export.failed');
          $scope.handleShowToast(message, true);
        });
      });
    };
  }
}());
