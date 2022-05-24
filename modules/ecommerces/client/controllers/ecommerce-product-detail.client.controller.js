(function () {
  'use strict';

  angular
    .module('ecommerces.company')
    .controller('EcommerceProductDetailController', EcommerceProductDetailController);

  EcommerceProductDetailController.$inject = ['$scope', '$stateParams', '$state', '$filter', 'EcommercesApi', 'CartsApi'];

  function EcommerceProductDetailController($scope, $stateParams, $state, $filter, EcommercesApi, CartsApi) {
    var vm = this;
    vm.avatar;
    vm.avatarIndex = 0;
    vm.numberProduct;
    vm.product = {};
    vm.quantityProduct = 1;
    vm.acceptedScheduleText;
    vm.master = $scope.masterdata;
    vm.productId = $stateParams.productId;
    vm.municId = $stateParams.municId;
    vm.isValidQuantityProduct = false;

    onCreate();

    function onCreate() {
      getProjectsSelected(vm.productId);
    }

    function getProjectsSelected(productId) {
      $scope.handleShowWaiting();
      EcommercesApi.getProductDetail(productId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.product = res;
          vm.avatar = vm.product.avatar;
          vm.product.pictures.unshift(vm.avatar);

          if (vm.product.is_accept_schedule === 1) {
            vm.acceptedScheduleText = '指定不可';
          }

          if (vm.product.is_accept_schedule === 2) {
            vm.acceptedScheduleText = vm.product.accepted_schedule.reduce(function (current, item, index) {
              current += item + '\n';
              return current;
            }, '');
          }

          if (vm.product.municipality.is_setting_gift_bows === undefined) {
            vm.product.municipality.is_setting_gift_bows = true;
          }
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
          $state.go('company.ecommerces.home');
        });
    }

    vm.setAvatar = function (url, index) {
      vm.avatar = url;
      vm.avatarIndex = index;
    };

    vm.isSelected = function (index) {
      return vm.avatarIndex === index;
    };

    vm.maxQuantity = function () {
      var maxQuantity = vm.product.is_set_max_quantity === 2 ? vm.product.max_quantity : 9999;
      var maxQuantityStock = vm.product.is_set_stock_quantity === 2 ? vm.product.stock_quantity : 9999;
      return maxQuantity < maxQuantityStock ? maxQuantity : maxQuantityStock;
    };

    vm.addToCart = function () {
      if (/\D/.test(vm.quantityProduct) ||
        vm.product.sell_status !== 1 ||
        !vm.quantityProduct) {
        return;
      }

      var maxQuantity = vm.maxQuantity();
      if (maxQuantity && vm.quantityProduct && vm.quantityProduct > maxQuantity) {
        if (vm.product.is_set_max_quantity === 2 && maxQuantity === vm.product.max_quantity) {
          var message4 = $filter('translate')('ecommerce.products.detail.controller.message.error_max_quantity')
            .replace('{0}', vm.product.name)
            .replace('{1}', vm.product.max_quantity);
          $scope.handleShowToast(message4, true);
          return;
        }
        if (vm.product.is_set_stock_quantity === 2 && maxQuantity === vm.product.stock_quantity) {
          var message3 = $filter('translate')('ecommerce.products.detail.controller.message.error_stock_quantity')
            .replace('{0}', vm.product.name)
            .replace('{1}', vm.product.stock_quantity);
          $scope.handleShowToast(message3, true);
          return;
        }
      }

      if (vm.quantityProduct && vm.product.municipality && vm.product.municipality.max_quantity && vm.quantityProduct > vm.product.municipality.max_quantity) {
        var message1 = $filter('translate')('ecommerce.cart.controller.message.error_max_quantity_per_order');
        message1 = message1.replace('{0}', vm.product.municipality.max_quantity);
        $scope.handleShowToast(message1, true);
        return;
      }

      $scope.handleShowWaiting();
      CartsApi.addOrUpdateCart({ productId: vm.productId, municipalityId: vm.municId, quantity: vm.quantityProduct, isFromTop: false })
        .success(function (res) {
          $scope.handleCloseWaiting();
          if (res) {
            $state.go('company.ecommerces.cart');
          }
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
          return false;
        });
    };

    vm.setDefaultValueQuantity = function (event) {
      if (!event) {
        return;
      }

      if (event.target) {
        var value = event.target.value;
        if (!value || Number(value) < 1) {
          vm.quantityProduct = 1;
        }
      }
    };

    vm.getApplyCondition = function () {
      var text = [];
      if (vm.product.municipality && vm.product.municipality.is_apply_times) {
        text.push('何度も申し込み可');
      }

      if (vm.product.is_apply_condition) {
        text.push('オンライン決済限定');
      }

      return text.join('、');
    };
  }
}());
