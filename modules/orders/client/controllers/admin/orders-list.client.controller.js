(function () {
  'use strict';

  angular
    .module('orders.admin1')
    .controller('AdminOrderListController', AdminOrderListController);

  AdminOrderListController.$inject = ['$scope', '$filter', '$location', 'OrderApi'];

  function AdminOrderListController($scope, $filter, $location, OrderApi) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.listIds = [];
    vm.listIdsAll = [];
    vm.isDisable = true;
    vm.ids = [];

    onCreate();

    function onCreate() {
      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('orders', clear);
      vm.condition.limitToDisplay = vm.condition.limit;
      vm.condition.export_status = 1;
      vm.condition.is_usage_system = 'all';
      vm.condition.sort_column = 'number';
      vm.condition.sort_direction = '-';
      vm.dateOptionsCreatedMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsCreatedMax = { showWeeks: false, minDate: null };
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      vm.listIds = [];
      vm.ids = [];
      vm.listIdsAll = [];

      OrderApi.adminList(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.orders = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          vm.condition.limitToDisplay = vm.condition.limit;
          $scope.conditionFactoryUpdate('orders', vm.condition);
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
    vm.onAdminDownloadCsvAll = function () {
      $scope.handleShowConfirm({
        message: '注文データをダウンロードします。よろしいですか？'
      }, function () {
        OrderApi.adminExport(vm.condition)
          .success(function (res) {
            window.open('/' + res.url, '_newtab');
          });
      });
    };

    vm.onChangeCreatedMin = function () {
      vm.dateOptionsCreatedMax.minDate = new Date(vm.condition.created_min);
    };

    vm.onChangeCreatedMax = function () {
      vm.dateOptionsCreatedMin.maxDate = new Date(vm.condition.created_max);
    };

    vm.getOrderFee = function (item) {
      if (!item.munic_fee || item.munic_fee === 0) {
        return 0;
      }

      return (item.munic_fee * item.total) / 100;
    };
  }
}());
