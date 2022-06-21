(function () {
  'use strict';

  angular
    .module('orders.admin')
    .controller('OrderHistoryController', OrderHistoryController);

  OrderHistoryController.$inject = ['$scope', '$filter', 'OrderHistoryApi', 'OrderApi', 'ProductApi'];

  function OrderHistoryController($scope, $filter, OrderHistoryApi, OrderApi, ProductApi) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.docs;
    vm.dateOptionsCreatedMin = { showWeeks: false, maxDate: null };
    vm.dateOptionsCreatedMax = { showWeeks: false, minDate: null };

    onCreate();

    function onCreate() {
      prepareCondition();
      getMunicipality();
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('orders-admin-export', clear);
    }

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

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      OrderHistoryApi.history(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.docs = res;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    vm.getMunicDetail = function (municId) {
      var munic = _.find(vm.docs, function (doc) {
        return doc.municId === municId;
      });

      if (munic && !munic.isFetchDetail) {
        OrderHistoryApi.historyByMunic(municId)
          .success(function (res) {
            $scope.handleCloseWaiting();
            munic.isFetchDetail = true;
            munic.isFilterCountByMonth = true;
            munic.isFilterPriceByMonth = true;
            munic = Object.assign(munic, res);
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
            $scope.handleShowToast(message, true);
          });
      }
    };

    vm.changeFilterCountMunic = function (municId, byMonth) {
      var munic = _.find(vm.docs, function (doc) {
        return doc.municId === municId;
      });
      if (munic) {
        OrderHistoryApi.filterCountByMunic(municId, byMonth)
          .success(function (res) {
            $scope.handleCloseWaiting();
            munic.isFilterCountByMonth = byMonth;
            munic = Object.assign(munic, res);
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
            $scope.handleShowToast(message, true);
          });
      }
    };

    vm.changeFilterPriceMunic = function (municId, byMonth) {
      var munic = _.find(vm.docs, function (doc) {
        return doc.municId === municId;
      });
      if (munic) {
        OrderHistoryApi.filterPriceByMunic(municId, byMonth)
          .success(function (res) {
            $scope.handleCloseWaiting();
            munic.isFilterPriceByMonth = byMonth;
            munic = Object.assign(munic, res);
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
            $scope.handleShowToast(message, true);
          });
      }
    };

    vm.onAdminDownloadExcelAll = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.adminExport');
        return false;
      }

      $scope.handleShowConfirm({
        message: '注文データをダウンロードします。よろしいですか？'
      }, function () {
        OrderApi.adminExportExcel(vm.condition)
          .success(function (res) {
            window.open('/' + res.url, '_newtab');
          });
      });
    };

    function getMunicipality() {
      ProductApi.getMunicipalityAll()
        .success(function (res) {
          vm.municipalities = res;
        });
    }
  }
}());
