(function () {
  'use strict';

  angular
    .module('ecommerces.company')
    .controller('EcommerceNoticeListController', EcommerceNoticeListController);

  EcommerceNoticeListController.$inject = ['$scope', 'EcommercesApi', '$filter'];

  function EcommerceNoticeListController($scope, EcommercesApi, $filter) {
    var vm = this;
    onCreate();

    function onCreate() {
      prepareCondition(true);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('notices_ec', clear, { limit: 10 });
      vm.condition.sort_column = 'start_time';
      vm.condition.sort_direction = '-';
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      EcommercesApi.pagingNotices(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.docs = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('notices_ec', vm.condition);
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    /** start handle search, sort & paging */
    vm.handlePageChanged = function () {
      handleSearch();
    };
  }
}());
