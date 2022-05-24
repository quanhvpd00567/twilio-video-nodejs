(function () {
  'use strict';

  angular
    .module('events.company')
    .controller('EventListController', EventListController);

  EventListController.$inject = ['$scope', '$state', 'EventService', 'EventsApi', '$filter', 'RequestRegistrationApi'];

  function EventListController($scope, $state, EventService, EventsApi, $filter, RequestRegistrationApi) {
    var vm = this;
    vm.companyId = null;
    vm.isDelete = false;
    vm.isAssignRequest = false;
    onCreate();

    function onCreate() {
      vm.companyId = $state.params.companyId;
      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && !vm.companyId) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }
      if (vm.companyId) {
        vm.isAssignRequest = true;
        RequestRegistrationApi.checkPermissionRequest({ companyId: vm.companyId })
          .success(function (res) {
            if (res.perrmision_error) {
              $scope.handleErrorFeatureAuthorization();
            }

            vm.featureAuthor = res;
            var features_authorized = vm.featureAuthor.features_authorized;
            features_authorized.forEach(function (item) {
              if (item.feature === 'delete_event' && vm.key === 'delete_event') {
                vm.isDelete = true;
              }
            });
          });
      } else {
        vm.isDelete = true;
      }

      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('events', clear);
      vm.condition.sort_column = 'created';
      vm.condition.sort_direction = '-';
      vm.condition.companyId = vm.companyId;

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
      EventsApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.docs = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('events', vm.condition);
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
      if (!changed && (key === 'start_max' || key === 'end_max' || key === 'created_max')) {
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
      vm.dateOptionsStartTimeMax.minDate = new Date(vm.condition.start_min);
    };

    vm.onChangeStartTimeMax = function () {
      vm.dateOptionsStartTimeMin.maxDate = new Date(vm.condition.start_max);
    };

    vm.onChangeEndTimeMin = function () {
      vm.dateOptionsEndTimeMax.minDate = new Date(vm.condition.end_min);
    };

    vm.onChangeEndTimeMax = function () {
      vm.dateOptionsEndTimeMin.maxDate = new Date(vm.condition.end_max);
    };

    vm.onChangeCreatedMin = function () {
      vm.dateOptionsCreatedMax.minDate = new Date(vm.condition.created_min);
    };

    vm.onChangeCreatedMax = function () {
      vm.dateOptionsCreatedMin.maxDate = new Date(vm.condition.created_max);
    };

    vm.concatProjectNames = function (projectNames) {
      var string = '';
      _.forEach(projectNames, function (name, index) {
        string += name;
        if (index !== (projectNames.length - 1)) {
          string += '・';
        }
      });

      return string;
    };

    vm.remove = function (_id) {
      $scope.handleShowConfirm({
        message: $filter('translate')('event.list.controller.message.confirm_delete')
      }, function () {
        var event = new EventService({ _id: _id });
        $scope.handleShowWaiting();
        event.$remove(function () {
          handleSearch(true);
          var message = $filter('translate')('event.list.controller.message.delete_success');
          $scope.handleShowToast(message);
        }, function (error) {
          $scope.handleCloseWaiting();
          var message = (error && error.message) || (error && error.data && error.data.message) || $filter('translate')('event.list.controller.message.delete_failed');
          $scope.handleShowToast(message, true);
        });
      });
    };

    vm.export = function () {
      $scope.handleShowConfirm({
        message: $filter('translate')('common.excel.export.confirm')
      }, function () {
        $scope.handleShowWaiting();
        EventsApi.export(vm.condition)
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
