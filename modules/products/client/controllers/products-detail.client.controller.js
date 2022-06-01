(function () {
  'use strict';

  angular
    .module('products.admin')
    .controller('ProductDetailController', ProductDetailController);

  ProductDetailController.$inject = ['$scope', 'product', '$stateParams', 'ProductApi', '$filter'];

  function ProductDetailController($scope, product, $stateParams, ProductApi, $filter) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.product = product;
    vm.imageUrl = $scope.getImageDefault(vm.product.avatar);

    // getMunicipality();

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
