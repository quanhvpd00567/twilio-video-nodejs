(function () {
  'use strict';

  angular
    .module('products.municipality')
    .controller('ProductDetailController', ProductDetailController);

  ProductDetailController.$inject = ['$scope', 'product', '$stateParams', 'ProductApi', '$filter', 'RequestsApplicationApi'];

  function ProductDetailController($scope, product, $stateParams, ProductApi, $filter, RequestsApplicationApi) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.product = product;
    vm.requestItemId = $stateParams.requestItemId;
    vm.isNeedAuthorize = $stateParams.isNeedAuthorize;
    vm.municipalityId = $stateParams.municipalityId;
    vm.key = $stateParams.key;
    vm.role = $scope.Authentication.user.roles[0];
    vm.isAdmin = $scope.isAdminOrSubAdmin;

    if (vm.requestItemId) {
      $scope.handleShowWaiting();
      RequestsApplicationApi.get(vm.requestItemId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          Object.assign(vm.product, res.data);
          vm.imageUrl = $scope.getImageDefault(vm.product.avatar);
          getMunicipality();
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
    } else {
      vm.imageUrl = $scope.getImageDefault(vm.product.avatar);
      getMunicipality();
    }

    function getMunicipality() {
      ProductApi.getMunicipality(vm.product && vm.product.municipality)
        .success(function (res) {
          vm.municInfo = res;
          if (vm.municInfo && vm.municInfo.is_setting_gift_bows === undefined) {
            vm.municInfo.is_setting_gift_bows = true;
          }
        });
    }
  }
}());
