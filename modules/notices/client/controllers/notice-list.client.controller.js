(function () {
  'use strict';

  angular
    .module('notices.admin')
    .controller('NoticeListController', NoticeListController);

  NoticeListController.$inject = ['$scope', 'NoticesService', 'NoticesApi', '$filter', 'NoticesHelper'];

  function NoticeListController($scope, NoticesService, NoticesApi, $filter, NoticesHelper) {
    var vm = this;
    vm.NoticesHelper = NoticesHelper;
    onCreate();

    function onCreate() {
      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('notices', clear);
      vm.condition.sort_column = 'created';
      vm.condition.sort_direction = '-';
      // vm.dateOptionsCreatedMin = { showWeeks: false, maxDate: null };
      // vm.dateOptionsCreatedMax = { showWeeks: false, minDate: null };
      vm.dateOptionsStartTimeMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsStartTimeMax = { showWeeks: false, minDate: null };
      vm.dateOptionsEndTimeMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsEndTimeMax = { showWeeks: false, minDate: null };
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      NoticesApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.docs = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('notices', vm.condition);
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
      if (!changed && (key === 'created_max' || key === 'start_time_max' || key === 'end_time_max')) {
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
    /** end handle search, sort & paging */

    vm.remove = function (_id) {
      $scope.handleShowConfirm({
        message: $filter('translate')('notice.list.controller.message.confirm_delete')
      }, function () {
        var notice = new NoticesService({ _id: _id });
        notice.$remove(function () {
          handleSearch();
          var message = $filter('translate')('notice.list.controller.message.delete_success');
          $scope.handleShowToast(message);
        }, function (error) {
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
      });
    };

    vm.stop = function (_id) {
      $scope.handleShowConfirm({
        message: $filter('translate')('notice.list.controller.message.confirm_stop')
      }, function () {
        $scope.handleShowWaiting();
        NoticesApi.stop(_id)
          .success(function (_res) {
            var message = $filter('translate')('notice.list.controller.message.stop_success');
            $scope.handleShowToast(message);
            handleSearch(true);
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            var message = error && error.data && error.data.message || $filter('translate')('notice.list.controller.message.stop_fail');
            $scope.handleShowToast(message, true);
          });
      });
    };

    vm.isDisableStopButton = function (notice) {
      var today = new Date();
      return today <= new Date(notice.start_time) || today >= new Date(notice.end_time);
    };

    vm.onChangeCreatedMin = function () {
      vm.dateOptionsCreatedMax.minDate = new Date(vm.condition.created_min);
    };

    vm.onChangeCreatedMax = function () {
      vm.dateOptionsCreatedMin.maxDate = new Date(vm.condition.created_max);
    };

    vm.onChangeStartTimeMin = function () {
      vm.dateOptionsStartTimeMax.minDate = new Date(vm.condition.start_time_min);
    };

    vm.onChangeStartTimeMax = function () {
      vm.dateOptionsStartTimeMin.maxDate = new Date(vm.condition.start_time_max);
    };

    vm.onChangeEndTimeMin = function () {
      vm.dateOptionsEndTimeMax.minDate = new Date(vm.condition.end_time_min);
    };

    vm.onChangeEndTimeMax = function () {
      vm.dateOptionsEndTimeMin.maxDate = new Date(vm.condition.end_time_max);
    };

    vm.export = function () {
      $scope.handleShowConfirm({
        message: $filter('translate')('common.excel.export.confirm')
      }, function () {
        $scope.handleShowWaiting();
        NoticesApi.export(vm.condition)
          .then(function (rs) {
            $scope.handleCloseWaiting();
            window.open('/' + rs.data.url, '_newtab');
          })
          .catch(function (res) {
            $scope.handleCloseWaiting();
            var message = res.data && res.data.message || $filter('translate')('common.excel.export.failed');
            $scope.handleShowToast(message, true);
          });
      });
    };
  }
}());
