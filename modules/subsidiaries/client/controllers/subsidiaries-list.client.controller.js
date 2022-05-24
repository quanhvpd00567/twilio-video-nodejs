(function () {
  'use strict';

  angular
    .module('employees.admin')
    .controller('SubsidiaryListController', SubsidiaryListController);

  SubsidiaryListController.$inject = ['$scope', '$state', '$filter', '$location', 'SubsidiaryApi', 'SubsidiaryService', 'RequestRegistrationApi'];

  function SubsidiaryListController($scope, $state, $filter, $location, SubsidiaryApi, SubsidiaryService, RequestRegistrationApi) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.roles = vm.master.company_roles;
    vm.isEdit = false;
    vm.isDelete = false;
    vm.isAssignRequest = false;
    onCreate();

    function onCreate() {
      vm.companyId = $state.params.companyId;
      vm.key = $state.params.key;
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
              return;
            }

            vm.featureAuthor = res;
            var features_authorized = vm.featureAuthor.features_authorized;
            features_authorized.forEach(function (item) {
              if (item.feature === 'update_subsidiary' && vm.key === 'update_subsidiary') {
                vm.isEdit = true;
              }
              if (item.feature === 'delete_subsidiary' && vm.key === 'delete_subsidiary') {
                vm.isDelete = true;
              }
            });
          });
      } else {
        vm.isEdit = true;
        vm.isDelete = true;
      }

      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('subsidiaries', clear);
      vm.condition.companyId = vm.companyId;
      vm.dateOptionsStartMax = { showWeeks: false, maxDate: null };
      vm.dateOptionsStartMin = { showWeeks: false, minDate: null };
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      vm.condition.is_paging = true;
      SubsidiaryApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.subsidiaries = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('subsidiaries', vm.condition);
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
    vm.remove = function (_id) {
      $scope.handleShowConfirm({
        message: $filter('translate')('subsidiaries.list.controller.message.confirm_delete')
      }, function () {
        SubsidiaryApi.delete(_id, vm.companyId)
          .success(function () {
            handleSearch();
            var message = $filter('translate')('subsidiaries.list.controller.message.delete_success');
            $scope.handleShowToast(message);
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            var message = error && error && error.message || $filter('translate')('common.data.failed');
            $scope.handleShowToast(message, true);
          });
      });
    };

    vm.onChangeStartMin = function () {
      vm.dateOptionsStartMax.minDate = new Date(vm.condition.created_min);
    };

    vm.onChangeStartMax = function () {
      vm.dateOptionsStartMin.maxDate = new Date(vm.condition.created_max);
    };

    vm.isShowButtonDelete = function (subsidiary) {
      if (subsidiary.user_ids === undefined || subsidiary.user_ids.length === 0) {
        return true;
      }

      return false;
    };
  }
}());
