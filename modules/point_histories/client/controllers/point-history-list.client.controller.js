(function () {
  'use strict';

  angular
    .module('pointHistories.admin')
    .controller('PointHistoryListController', PointHistoryListController);

  PointHistoryListController.$inject = ['$scope', 'PointHistoriesApi', '$filter', '$q', 'ngDialog'];

  function PointHistoryListController($scope, PointHistoriesApi, $filter, $q, ngDialog) {
    var vm = this;
    vm.economicYears = $scope.getEconomicYearsOfJapan();

    vm.totalCurrentPoints = 0;

    vm.yearOfPointsExpired = vm.economicYears[0].toString();
    vm.totalExpiredPoints = 0;
    vm.expiredPoints = [];

    vm.yearOfPointsUsedSelected = vm.economicYears[0].toString();
    vm.monthOfPointsUsedSelected = (new Date().getMonth() + 1).toString();
    vm.monthsOfPointsUsed = generateMonths();
    vm.totalUsedPointsOfYear = 0;
    vm.totalPaymentAmountsOfYear = 0;
    vm.totalPaymentAmountsOfMonth = 0;
    vm.paymentHistories = [];

    onCreate();

    function onCreate() {
      prepareConditionForCurrentPoints(false);

      $scope.handleShowWaiting();
      $q.all([handleSearchForCurrentPoints(true), getPointsUsed(true), getPointsExpired(true)]).then(function (result) {
        $scope.handleCloseWaiting();
      }).catch(function (error) {
        $scope.handleCloseWaiting();
        var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
        $scope.handleShowToast(message, true);
      });
    }

    // points current
    vm.handlePageChanged = function () {
      handleSearchForCurrentPoints();
    };

    function prepareConditionForCurrentPoints(clear) {
      vm.conditionForCurrentPoints = $scope.prepareCondition('currentPoints', clear);
      vm.conditionForCurrentPoints.limit = 5;
    }

    function handleSearchForCurrentPoints(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      PointHistoriesApi.getCurrentPoints(vm.conditionForCurrentPoints)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.currentPoints = res.docs;
          vm.totalCurrentPoints = res.totalPoints;
          vm.conditionForCurrentPoints.count = res.docs.length;
          vm.conditionForCurrentPoints.page = res.page;
          vm.conditionForCurrentPoints.total = res.totalDocs;
          $scope.conditionFactoryUpdate('currentPoints', vm.conditionForCurrentPoints);
          return true;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
          return false;
        });
    }

    // points expired
    function getPointsExpired(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      return PointHistoriesApi.getExpiredPoints(Number(vm.yearOfPointsExpired))
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.expiredPoints = res && res.pointsExpired;
          vm.totalExpiredPoints = res && res.totalPointsExpired;
          return true;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
          return false;
        });
    }

    vm.changeYearOfExpiredPoints = function () {
      getPointsExpired();
    };

    // points used
    vm.changeYearOfUsedPoints = function () {
      vm.monthsOfPointsUsed = generateMonths();
      getPointsUsed();
    };

    vm.changeMonthOfUsedPoints = function () {
      getPointsUsed();
    };

    vm.updatePaymentStatus = function (_id, isPaid) {
      if (isPaid) {
        return;
      }

      $scope.showModal = true;
      ngDialog
        .openConfirm({
          templateUrl:
            '/modules/point_histories/client/views/modal/modal-update-payment-status.client.view.html',
          scope: $scope,
          showClose: false,
          closeByDocument: false,
          width: 400,
          resolve: {
            isPaid: function () {
              return isPaid;
            }
          },
          controller: 'ModalUpdatePaymentStatusController',
          controllerAs: 'vm'
        })
        .then(function (newIsPaid) {
          $scope.showModal = false;
          if (!newIsPaid) {
            return;
          }

          if (newIsPaid !== isPaid) {
            updatePaymentStatus(_id, newIsPaid);
          }
        });
    };

    function updatePaymentStatus(paymentHistoryId, isPaid) {
      $scope.handleShowWaiting();
      PointHistoriesApi.updatePaymentStatus(paymentHistoryId, isPaid)
        .success(function (res) {
          $scope.handleCloseWaiting();
          var message = $filter('translate')('point_history.modal.update_payment_status.controller.message.update_payment_status_success');
          $scope.handleShowToast(message);
          getPointsUsed();
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
    }

    function getPointsUsed(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      return PointHistoriesApi.getUsedPoints(Number(vm.yearOfPointsUsedSelected), Number(vm.monthOfPointsUsedSelected))
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.totalUsedPointsOfYear = res && res.totalPointsUsedOfYear || 0;
          vm.totalPaymentAmountsOfYear = res && res.totalPaymentAmountsOfYear || 0;

          vm.totalPaymentAmountsOfMonth = res && res.totalPaymentAmountsOfMonth || 0;

          vm.paymentHistories = res && res.paymentHistories || [];
          return true;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
          return false;
        });
    }

    function generateMonths() {
      var year = vm.yearOfPointsUsedSelected;
      return [
        { id: '4', value: year + '/4' },
        { id: '5', value: year + '/5' },
        { id: '6', value: year + '/6' },
        { id: '7', value: year + '/7' },
        { id: '8', value: year + '/8' },
        { id: '9', value: year + '/9' },
        { id: '10', value: year + '/10' },
        { id: '11', value: year + '/11' },
        { id: '12', value: year + '/12' },
        { id: '1', value: Number(year) + 1 + '/1' },
        { id: '2', value: Number(year) + 1 + '/2' },
        { id: '3', value: Number(year) + 1 + '/3' }
      ];
    }

    vm.generateAggregationPeriod = function () {
      var month = Number(vm.monthOfPointsUsedSelected);
      var year = Number(vm.yearOfPointsUsedSelected);

      month = month - 1;
      if ([1, 2, 3].indexOf(month) !== -1) {
        year = year + 1;
      }

      if (month === 0) {
        month = 12;
      }

      var lastDayOfMonth = new Date(year, month, 0);
      return year + $filter('translate')('common.label.year')
        + $scope.padding(month) + $filter('translate')('common.label.month')
        + '01' + $filter('translate')('common.label.day')
        + '～'
        + $scope.padding(month) + $filter('translate')('common.label.month')
        + $scope.padding(lastDayOfMonth.getDate()) + $filter('translate')('common.label.day')
        + $filter('translate')('point_history.detail.used.usage.label');
    };

    vm.generatePaymentDate = function () {
      var month = Number(vm.monthOfPointsUsedSelected);
      var year = Number(vm.yearOfPointsUsedSelected);
      if ([1, 2, 3].indexOf(month) !== -1) {
        year = year + 1;
      }
      return year + '/' + month + '/10';
    };
  }
}());
