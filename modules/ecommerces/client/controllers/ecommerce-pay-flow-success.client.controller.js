(function () {
  'use strict';

  angular
    .module('ecommerces.company')
    .controller('EcommercePayFlowSuccessController', EcommercePayFlowSuccessController);

  EcommercePayFlowSuccessController.$inject = ['$scope', '$state', 'MunicipalitiesApi'];
  function EcommercePayFlowSuccessController($scope, $state, MunicipalitiesApi) {
    var vm = this;
    var municId = $state.params.municId;
    vm.municipality;
    onCreate();

    function onCreate() {
      getMunicipalityContactInfo();
    }

    function getMunicipalityContactInfo() {
      $scope.handleShowWaiting();
      MunicipalitiesApi.getMunicipalityContactInfo(municId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.municipality = res;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
    }
  }
}());
