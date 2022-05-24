(function () {
  'use strict';

  angular
    .module('companies.admin')
    .controller('DepartmentListCompanyController', DepartmentListCompanyController);

  DepartmentListCompanyController.$inject = ['$scope', '$filter', 'DepartmentApi', 'DepartmentService', 'SubsidiaryApi'];

  function DepartmentListCompanyController($scope, $filter, DepartmentApi, DepartmentService, SubsidiaryApi) {
    var vm = this;
    vm.master = $scope.masterdata;
    onCreate();

    function onCreate() {
      getAllByCompany();
      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('departments', clear);
      // vm.condition.limit = 1;
      // vm.condition.sort_direction = '';
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      DepartmentApi.paging(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.departments = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('departments', vm.condition);
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
        message: $filter('translate')('departments.list.controller.message.confirm_delete')
      }, function () {
        var department = new DepartmentService({ _id: _id });
        department.$remove(function () {
          handleSearch();
          var message = $filter('translate')('departments.list.controller.message.delete_success');
          $scope.handleShowToast(message);
        }, function (error) {
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
      });
    };

    vm.onChangeCreatedMin = function () {
      vm.dateOptionsCreatedMax.minDate = new Date(vm.condition.created_min);
    };

    vm.onChangeCreatedMax = function () {
      vm.dateOptionsCreatedMin.maxDate = new Date(vm.condition.created_max);
    };

    function getAllByCompany() {
      SubsidiaryApi.getAllByCompany({})
        .success(function (res) {
          vm.subsidiaries = res;
          $scope.handleCloseWaiting();
        }).error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.message || $filter('translate')('companies.form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        });
    }
  }
}());
