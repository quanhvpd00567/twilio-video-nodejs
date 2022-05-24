(function () {
  'use strict';

  angular
    .module('ecommerces.company')
    .controller('EcommerceCartController', EcommerceCartController);

  EcommerceCartController.$inject = ['$scope', 'CartsApi', '$filter', '$state'];

  function EcommerceCartController($scope, CartsApi, $filter, $state) {
    var vm = this;
    vm.carts = [];
    vm.configObject;
    vm.POINT_USE_TYPE = {
      NOT_USE_POINT: 'not_use_point',
      USE_SOME_POINT: 'use_some_point',
      USE_ALL_POINT: 'use_all_point'
    };
    onCreate();

    function onCreate() {
      getCartsPending();
    }

    function getCartsPending(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      CartsApi.getCartsPending()
        .success(function (res) {
          $scope.handleCloseWaiting();

          vm.carts = res.carts;
          vm.configObject = res.configObject;
          vm.carts = _.map(vm.carts, function (cart) {
            cart.pointUseTypeSelected = vm.POINT_USE_TYPE.NOT_USE_POINT;

            if (cart.pointsOfMunicipality) {
              cart.pointsOfMunicipality = Math.floor(cart.pointsOfMunicipality);
            }

            calculateTotalAmountAndSubtotal(cart);
            return cart;
          });
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
          return false;
        });
    }

    vm.save = function (isValid, cart) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.cartForm');
        return false;
      }

      // Check point input
      if (cart.pointsInput && cart.pointsInput > cart.maxPoints) {
        var message0 = $filter('translate')('ecommerce.cart.controller.message.error_input_max_point');
        $scope.handleShowToast(message0, true);
        return;
      }

      var isStoppedSellProduct = _.find(cart.products, function (item) {
        return item.product && item.product.isStoppedSell;
      });
      if (isStoppedSellProduct) {
        var message = $filter('translate')('ecommerce.cart.controller.message.error_product_stopped');
        $scope.handleShowToast(message, true);
        return;
      }

      //  Check product.stock_quantity or product.max_quantity
      for (var i = 0; i < cart.products.length; i++) {
        var item = cart.products[i];
        if (item.maxQuantity && item.quantity > item.maxQuantity) {
          if (item.product.is_set_max_quantity === 2 && item.maxQuantity === item.product.max_quantity) {
            var message4 = $filter('translate')('ecommerce.products.detail.controller.message.error_max_quantity')
              .replace('{0}', item.product.name)
              .replace('{1}', item.maxQuantity);
            $scope.handleShowToast(message4, true);
            return;
          }
          if (item.product.is_set_stock_quantity === 2 && item.maxQuantity === item.product.stock_quantity) {
            var message3 = $filter('translate')('ecommerce.products.detail.controller.message.error_stock_quantity')
              .replace('{0}', item.product.name)
              .replace('{1}', item.maxQuantity);
            $scope.handleShowToast(message3, true);
            return;
          }
          return;
        }
      }

      // check municipality.max_quantity (max quantity per 1 order)
      var totalQuantityOrdered = _.reduce(cart.products, function (total, item) {
        return total + item.quantity;
      }, 0);
      if (cart.municipality && cart.municipality.max_quantity && totalQuantityOrdered > cart.municipality.max_quantity) {
        var message1 = $filter('translate')('ecommerce.cart.controller.message.error_max_quantity_per_order');
        message1 = message1.replace('{0}', cart.municipality.max_quantity);
        $scope.handleShowToast(message1, true);
        return;
      }

      $scope.handleShowWaiting();
      // update price again
      cart.products = _.map(cart.products, function (item) {
        item.price = item.product.price;
        return item;
      });
      CartsApi.saveCartInfo(cart._id, cart)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.errorsMessage = [];
          var success = res && res.success;
          if (success) {
            $state.go('company.ecommerces.pay1', { municId: cart.municipality._id });
          } else {
            vm.errorMessages = res && res.errors;
          }
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
    };

    vm.recalculateTotalAmountAndSubtotal = function (cart) {
      calculateTotalAmountAndSubtotal(cart);
    };

    function calculateTotalAmountAndSubtotal(cart) {
      if (!cart || !cart.products || cart.products.length === 0) {
        return 0;
      }
      var subtotal = _.reduce(cart.products, function (total, item) {
        return total + (item.product.price * item.quantity);
      }, 0);
      cart.subtotal = subtotal;

      var pointsUsed = 0;
      switch (cart.pointUseTypeSelected) {
        case vm.POINT_USE_TYPE.NOT_USE_POINT:
          pointsUsed = 0;
          cart.pointsInput = null;
          break;
        case vm.POINT_USE_TYPE.USE_SOME_POINT:
          pointsUsed = cart.pointsInput || 0;
          break;
        case vm.POINT_USE_TYPE.USE_ALL_POINT:
          pointsUsed = cart.pointsOfMunicipality;
          cart.pointsInput = null;
          break;
        default:
          break;
      }

      // Recalculate max points
      if (cart.subtotal && vm.configObject && vm.configObject.max_point) {
        cart.maxPoints = Math.floor(cart.subtotal * (vm.configObject.max_point / 100));
        if (cart.maxPoints > Math.floor(cart.pointsOfMunicipality)) {
          cart.maxPoints = Math.floor(cart.pointsOfMunicipality);
        }
      } else {
        cart.maxPoints = 0;
      }

      cart.pointsUsed = pointsUsed;
      if (cart.pointsUsed && vm.configObject && vm.configObject.max_point) {
        if (cart.pointsUsed < ((vm.configObject.max_point / 100) * cart.subtotal)) {
          cart.totalAmount = cart.subtotal - cart.pointsUsed;
        } else {
          if (cart.pointUseTypeSelected === vm.POINT_USE_TYPE.USE_ALL_POINT) {
            cart.pointsUsed = Math.floor((vm.configObject.max_point / 100) * cart.subtotal);
          }
          cart.totalAmount = cart.subtotal - cart.pointsUsed;
        }
      } else {
        cart.totalAmount = cart.subtotal;
      }

      if (cart.totalAmount < 0) {
        cart.totalAmount = 0;
      }

      return cart;
    }

    vm.removeProduct = function (productId, cartId) {
      $scope.handleShowConfirm({
        message: $filter('translate')('ecommerce.cart.controller.message.confirm_delete_product')
      }, function () {
        $scope.handleShowWaiting();
        CartsApi.removeProductFromCart(productId, cartId)
          .success(function () {
            var message = $filter('translate')('ecommerce.cart.controller.message.delete_success_success');
            $scope.handleShowToast(message);
            getCartsPending(true);
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            var message = error && error.data && error.data.message || $filter('translate')('ecommerce.cart.controller.message.delete_success_failed');
            $scope.handleShowToast(message, true);
            return false;
          });
      });
    };

    vm.setDefaultValueQuantity = function (event, item, cart) {
      if (!event) {
        return;
      }

      if (event.target) {
        var value = event.target.value;
        if (!value || Number(value) < 1) {
          item.quantity = 1;

          if (cart) {
            calculateTotalAmountAndSubtotal(cart);
          }
        }
      }
    };

    vm.setDefaultValuePointsInput = function (event, cart) {
      if (!event) {
        return;
      }

      if (event.target) {
        var value = event.target.value;
        if (!value || Number(value) < 0) {
          cart.pointsInput = 0;

          if (cart) {
            calculateTotalAmountAndSubtotal(cart);
          }
        }
      }
    };
  }
}());
