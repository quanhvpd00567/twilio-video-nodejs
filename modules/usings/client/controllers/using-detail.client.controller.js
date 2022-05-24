(function () {
  'use strict';

  angular
    .module('usings.municipality')
    .controller('UsingDetailControllerusing', UsingDetailControllerusing);

  UsingDetailControllerusing.$inject = ['$scope', '$stateParams', 'usingResolve', 'RequestsApplicationApi'];

  function UsingDetailControllerusing($scope, $stateParams, using, RequestsApplicationApi) {
    var vm = this;
    vm.using = using;
    vm.requestItemId = $stateParams.requestItemId;

    onCreate();

    function onCreate() {
      if ($scope.isAdminOrSubAdmin) {
        vm.municipalityId = vm.using.municipality;
        vm.key = $stateParams.key;
        vm.isNeedAuthorize = $stateParams.isNeedAuthorize;
      }
      if (vm.requestItemId) {
        $scope.handleShowWaiting();
        RequestsApplicationApi.get(vm.requestItemId)
          .success(function (res) {
            $scope.handleCloseWaiting();
            Object.assign(vm.using, res.data);
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            $scope.handleShowToast($scope.parseErrorMessage(error), true);
          });
      }
    }
  }
}());
