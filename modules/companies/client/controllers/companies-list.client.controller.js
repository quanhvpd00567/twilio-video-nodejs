(function () {
  'use strict';

  angular
    .module('companies.admin')
    .controller('CompanyListController', CompanyListController);

  CompanyListController.$inject = ['$scope', '$filter', '$location', 'CompanyApi', 'CompanyService'];

  function CompanyListController($scope, $filter, $location, CompanyApi, CompanyService) {
    var vm = this;
    vm.master = $scope.masterdata;
    onCreate();

    function onCreate() {
      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('companies', clear);
      // vm.condition.sort_column = '';
      // vm.condition.sort_direction = '';
      vm.dateOptionsCreatedMax = { showWeeks: false, maxDate: null };
      vm.dateOptionsCreatedMin = { showWeeks: false, minDate: null };
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      CompanyApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.companies = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('companies', vm.condition);
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
        message: $filter('translate')('companies.list.controller.message.confirm_delete1')
      }, function () {
        $scope.handleShowConfirm({
          message: $filter('translate')('companies.list.controller.message.confirm_delete2')
        }, function () {
          var company = new CompanyService({ _id: _id });
          company.$remove(function () {
            handleSearch();
            var message = $filter('translate')('companies.list.controller.message.delete_success');
            $scope.handleShowToast(message);
          }, function (error) {
            $scope.handleShowToast($scope.parseErrorMessage(error), true);
          });
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
