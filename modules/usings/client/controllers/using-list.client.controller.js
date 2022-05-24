(function () {
  'use strict';

  angular
    .module('usings.municipality')
    .controller('UsingListController', UsingListController);

  UsingListController.$inject = ['$scope', '$state', 'UsingsService', 'UsingsApi', '$filter', 'RequestRegistrationApi'];

  function UsingListController($scope, $state, UsingsService, UsingsApi, $filter, RequestRegistrationApi) {
    var vm = this;
    vm.auth = $scope.Authentication.user;
    vm.isCreate = false;
    vm.isEdit = false;
    vm.isDelete = false;
    var FEATURE_MUNICIPALITY = $scope.masterdata.FEATURE_MUNICIPALITY;

    onCreate();

    function onCreate() {
      init();
      prepareCondition(false);
      handleSearch();
    }

    function init() {
      vm.municipalityId = $state.params.municipalityId;
      vm.key = $state.params.key;
      vm.isNeedAuthorize = $state.params.isNeedAuthorize;
      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && !vm.municipalityId && !vm.key) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }

      if (vm.municipalityId && vm.key) {
        vm.isCreate = vm.key === FEATURE_MUNICIPALITY.CREATE_USING;
        vm.isEdit = vm.key === FEATURE_MUNICIPALITY.UPDATE_USING;
        vm.isDelete = vm.key === FEATURE_MUNICIPALITY.DELETE_USING;
      } else {
        vm.isCreate = true;
        vm.isEdit = true;
        vm.isDelete = true;
      }
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('usings', clear);
      vm.condition.sort_column = 'start';
      vm.condition.sort_direction = '-';
      vm.dateOptionsStartMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsStartMax = { showWeeks: false, minDate: null };

      vm.dateOptionsEndMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsEndMax = { showWeeks: false, minDate: null };

      vm.dateOptionsCreatedMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsCreatedMax = { showWeeks: false, minDate: null };
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      if (vm.municipalityId) {
        vm.condition.municipalityId = vm.municipalityId;
      }
      UsingsApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.docs = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('usings', vm.condition);
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
      if (!changed && (key === 'created_max' || key === 'start_max' || key === 'end_max')) {
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
      var messageConfirm = $filter('translate')('using.list.controller.message.confirm_delete');
      if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
        messageConfirm = $filter('translate')('request_item.server.message.confirm_register');
      }
      $scope.handleShowConfirm({
        message: messageConfirm
      }, function () {
        var using = new UsingsService({ _id: _id });
        if (vm.municipalityId) {
          using.municipalityId = vm.municipalityId;
        }
        using.$remove(function () {
          handleSearch();
          var message = $filter('translate')('using.list.controller.message.delete_success');
          if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
            message = $filter('translate')('request_item.server.message.save_success');
          }
          $scope.handleShowToast(message);
        }, function (error) {
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
      });
    };

    vm.onChangeStartMin = function () {
      vm.dateOptionsStartMax.minDate = new Date(vm.condition.start_min);
    };

    vm.onChangeStartMax = function () {
      vm.dateOptionsStartMin.maxDate = new Date(vm.condition.start_max);
    };

    vm.onChangeEndMin = function () {
      vm.dateOptionsEndMax.minDate = new Date(vm.condition.end_min);
    };

    vm.onChangeEndMax = function () {
      vm.dateOptionsEndMin.maxDate = new Date(vm.condition.end_max);
    };

    vm.onChangeCreatedMin = function () {
      vm.dateOptionsCreatedMax.minDate = new Date(vm.condition.created_min);
    };

    vm.onChangeCreatedMax = function () {
      vm.dateOptionsCreatedMin.maxDate = new Date(vm.condition.created_max);
    };
  }
}());
