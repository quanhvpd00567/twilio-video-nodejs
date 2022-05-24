(function () {
  'use strict';

  angular
    .module('com_projects.admin')
    .controller('ComProjectListAdminController', ComProjectListAdminController);

  ComProjectListAdminController.$inject = ['$scope', '$filter', 'ComProjectApi', 'ngDialog'];

  function ComProjectListAdminController($scope, $filter, ComProjectApi, ngDialog) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.listIds = [];
    vm.isAdminAndSubAdmin = ['admin', 'sub_admin'].includes($scope.Authentication.user.roles[0]);
    onCreate();

    function onCreate() {
      // getSubsidiaries();
      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('com_projects', clear);
      vm.dateOptionsStartTimeMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsStartTimeMax = { showWeeks: false, minDate: null };
      vm.dateOptionsEndTimeMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsEndTimeMax = { showWeeks: false, minDate: null };
      vm.dateOptionsCreatedMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsCreatedMax = { showWeeks: false, minDate: null };
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      vm.listIds = [];

      ComProjectApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.com_projects = res.docs;
          vm.com_projects.map(function (item) {
            item.check = true;
            return item;
          });
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('com_projects', vm.condition);
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

    vm.handleConditionChanged = function (changed, key, old) {
      if (!changed && (key === 'start_time_max' || key === 'end_time_max' || key === 'created_max')) {
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

    vm.onChangeCreatedMin = function () {
      vm.dateOptionsCreatedMax.minDate = new Date(vm.condition.created_min);
    };

    vm.onChangeCreatedMax = function () {
      vm.dateOptionsCreatedMin.maxDate = new Date(vm.condition.created_max);
    };


    vm.onDownloadAll = function (type) {
      $scope.handleShowConfirm({
        message: '案件一覧をダウンロードします。よろしいですか？'
      }, function () {
        vm.condition.type = type;
        ComProjectApi.export(vm.condition)
          .success(function (res) {
            console.log(res.url);
            window.open('/' + res.url, '_newtab');
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
            $scope.handleShowToast(message, true);
          });
      });
    };
  }
}());
