(function () {
  'use strict';

  angular
    .module('ecommerces.company')
    .controller('EcommerceHistoryController', EcommerceHistoryController);

  EcommerceHistoryController.$inject = ['$scope', '$filter', 'EcommercesApi'];

  function EcommerceHistoryController($scope, $filter, EcommercesApi) {
    var vm = this;

    vm.datepickerOptions = {
      datepickerMode: 'year',
      minMode: 'year',
      maxDate: new Date()
    };

    vm.orderYear = new Date();
    vm.numberHistory = 5;

    onCreate();

    function onCreate() {
      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('ecommerce-history', clear);
      vm.condition.limit = 10;
      vm.condition.orderYear = vm.orderYear;
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      vm.condition.orderYear = vm.orderYear;
      EcommercesApi.getOrders(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.docs = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          vm.condition.totalPages = res.totalPages;
          $scope.conditionFactoryUpdate('ecommerce-history', vm.condition);
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
      vm.isClickedSort = true;
      vm.condition = $scope.handleSortChanged(vm.condition, sort_column);
      vm.reverse = vm.condition.sort_column === sort_column && vm.condition.sort_direction === '-';
      handleSearch();
    };

    vm.onChangeYearPicker = function () {
      if (!vm.orderYear) {
        vm.orderYear = new Date();
      }
      handleSearch();
    };
    vm.isShowPagination = function () {
      return vm.condition.totalPages > 1;
    };
  }
}());
