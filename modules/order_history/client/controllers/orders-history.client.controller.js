(function () {
  'use strict';

  angular
    .module('orders.admin')
    .controller('OrderHistoryController', OrderHistoryController);

  OrderHistoryController.$inject = ['$scope', '$filter', 'OrderHistoryApi', 'OrderApi'];

  function OrderHistoryController($scope, $filter, OrderHistoryApi, OrderApi) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.docs;

    onCreate();

    function onCreate() {
      handleSearch();
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      OrderHistoryApi.history()
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

      console.log(munic);

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

    vm.onAdminDownloadExcelAll = function () {
      $scope.handleShowConfirm({
        message: '注文データをダウンロードします。よろしいですか？'
      }, function () {
        console.log(121212);
        OrderApi.adminExportExcel()
          .success(function (res) {
            window.open('/' + res.url, '_newtab');
          });
      });
    };
  }
}());
