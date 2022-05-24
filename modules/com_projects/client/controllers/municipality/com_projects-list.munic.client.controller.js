(function () {
  'use strict';

  angular
    .module('com_projects.admin')
    .controller('ComProjectListMunicController', ComProjectListMunicController);

  ComProjectListMunicController.$inject = ['$scope', '$filter', 'ngDialog', 'ComProjectApi'];

  function ComProjectListMunicController($scope, $filter, ngDialog, ComProjectApi) {
    var vm = this;
    vm.master = $scope.masterdata;

    onCreate();

    function onCreate() {
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

    /** end handle search, sort & paging */

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

    // vm.updateSendStatus = function (_id, sendStatus) {
    //   $scope.showModal = true;
    //   ngDialog
    //     .openConfirm({
    //       templateUrl:
    //         '/modules/com_projects/client/views/munic/modal/modal-update-send-status.client.view.html',
    //       scope: $scope,
    //       showClose: false,
    //       closeByDocument: false,
    //       width: 400,
    //       resolve: {
    //         sendStatus: function () {
    //           return sendStatus;
    //         }
    //       },
    //       controller: 'ModalUpdateSendStatusController',
    //       controllerAs: 'vm'
    //     })
    //     .then(function (newSendStatus) {
    //       $scope.showModal = false;
    //       if (!newSendStatus) {
    //         return;
    //       }

    //       newSendStatus = Number(newSendStatus);
    //       if (newSendStatus !== sendStatus) {
    //         updateComproject(_id, { send_status: newSendStatus });
    //       }
    //     });
    // };

    // vm.updatePayStatus = function (_id, payStatus) {
    //   $scope.showModal = true;
    //   ngDialog
    //     .openConfirm({
    //       templateUrl:
    //         '/modules/com_projects/client/views/munic/modal/modal-update-pay-status.client.view.html',
    //       scope: $scope,
    //       showClose: false,
    //       closeByDocument: false,
    //       width: 400,
    //       resolve: {
    //         payStatus: function () {
    //           return payStatus;
    //         }
    //       },
    //       controller: 'ModalUpdatePayStatusController',
    //       controllerAs: 'vm'
    //     })
    //     .then(function (newPayStatus) {
    //       $scope.showModal = false;
    //       if (!newPayStatus) {
    //         return;
    //       }

    //       newPayStatus = Number(newPayStatus);
    //       if (newPayStatus !== payStatus) {
    //         updateComproject(_id, { pay_status: newPayStatus });
    //       }
    //     });
    // };

    // function updateComproject(comprojectId, body) {
    //   $scope.handleShowWaiting();
    //   ComProjectApi.updateById(comprojectId, body)
    //     .success(function (res) {
    //       var message = $filter('translate')('event.detail.controller.message.update_comproject_success');
    //       $scope.handleShowToast(message);

    //       handleSearch(true);
    //     })
    //     .error(function (error) {
    //       $scope.handleCloseWaiting();
    //       var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
    //       $scope.handleShowToast(message, true);
    //     });
    // }
  }
}());
