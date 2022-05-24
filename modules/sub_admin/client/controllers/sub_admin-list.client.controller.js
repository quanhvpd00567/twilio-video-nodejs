(function () {
  'use strict';

  angular
    .module('sub_admins.admin')
    .controller('SubAdminListController', SubAdminListController);

  SubAdminListController.$inject = ['$scope', '$filter', 'SubAdminApi', 'SubAdminService'];

  function SubAdminListController($scope, $filter, SubAdminApi, SubAdminService) {
    var vm = this;
    vm.master = $scope.masterdata;
    onCreate();

    function onCreate() {
      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('sub_admins', clear);
      // vm.condition.limit = 1;
      // vm.condition.sort_direction = '';
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      SubAdminApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.sub_admins = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('sub_admins', vm.condition);
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
        message: $filter('translate')('sub_admins.list.controller.message.confirm_delete')
      }, function () {
        var subAdmin = new SubAdminService({ _id: _id });
        subAdmin.$remove(function () {
          handleSearch();
          var message = $filter('translate')('sub_admins.list.controller.message.delete_success');
          $scope.handleShowToast(message);
        }, function (error) {
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
      });
    };
  }
}());
