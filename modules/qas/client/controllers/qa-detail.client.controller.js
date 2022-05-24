(function () {
  'use strict';

  angular
    .module('qas.admin')
    .controller('QADetailController', QADetailController);

  QADetailController.$inject = ['$scope', '$stateParams', 'QAsApi', '$filter', '$state'];

  function QADetailController($scope, $stateParams, QAsApi, $filter, $state) {
    var vm = this;
    var qaId = $stateParams.qaId;
    vm.qaId = qaId;
    vm.qa = {};
    onCreate();

    function onCreate() {
      $scope.handleShowWaiting();
      QAsApi.detail(qaId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.qa = res;
          if (!vm.qa) {
            var message = $filter('translate')('common.data.failed');
            $scope.handleShowToast(message, true);
            $state.go('admin.qas.list');
            return;
          }
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }
  }
}());
