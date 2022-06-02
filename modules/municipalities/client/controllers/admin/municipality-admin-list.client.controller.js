(function () {
  'use strict';

  angular
    .module('municipalities.admin')
    .controller('MunicipalityAdminListController', MunicipalityAdminListController);

  MunicipalityAdminListController.$inject = ['$scope', '$filter', '$location', 'MunicipalitiesApi', 'MunicipalitiesService'];

  function MunicipalityAdminListController($scope, $filter, $location, MunicipalitiesApi, MunicipalitiesService) {
    var vm = this;
    vm.master = $scope.masterdata;
    onCreate();

    function onCreate() {
      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('municipalities', clear);
      // vm.condition.sort_column = '';
      // vm.condition.sort_direction = '';
      vm.dateOptionsCreatedMax = { showWeeks: false, maxDate: null };
      vm.dateOptionsCreatedMin = { showWeeks: false, minDate: null };
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      MunicipalitiesApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.municipalities = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('municipalities', vm.condition);
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
    vm.remove = function (_id) {
      $scope.handleShowConfirm({
        message: $filter('translate')('municipalities.list.controller.message.confirm_delete')
      }, function () {
        var munic = new MunicipalitiesService({ _id: _id });
        munic.$remove(function () {
          handleSearch();
          var message = $filter('translate')('municipalities.list.controller.message.delete_success');
          $scope.handleShowToast(message);
        })
          .catch(function (error) {
            $scope.handleCloseWaiting();
            var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
            $scope.handleShowToast(message, true);
          });
      });
    };

    vm.onChangeCreatedMin = function () {
      vm.dateOptionsCreatedMax.minDate = new Date(vm.condition.created_min);
    };

    vm.onChangeCreatedMax = function () {
      vm.dateOptionsCreatedMin.maxDate = new Date(vm.condition.created_max);
    };
  }
}());
