(function () {
  'use strict';

  angular
    .module('ecommerces.company')
    .controller('EcommerceNoticeDetailController', EcommerceNoticeDetailController);

  EcommerceNoticeDetailController.$inject = ['$scope', '$stateParams', 'EcommercesApi', '$state', '$filter'];

  function EcommerceNoticeDetailController($scope, $stateParams, EcommercesApi, $state, $filter) {
    var vm = this;
    var noticeId = $stateParams && $stateParams.noticeId;

    onCreate();

    function onCreate() {
      if (!noticeId) {
        $state.go('company.ecommerces.notice_list');
      }

      $scope.handleShowWaiting();
      EcommercesApi.getNoticeById(noticeId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          if (!res) {
            $state.go('company.ecommerces.notice_list');
          }

          vm.notice = res;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }
  }
}());
