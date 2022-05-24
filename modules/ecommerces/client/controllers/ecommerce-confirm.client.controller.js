(function () {
  'use strict';

  angular
    .module('ecommerces.company')
    .controller('EcommerceConfirmController', EcommerceConfirmController);

  EcommerceConfirmController.$inject = ['$scope', '$state', 'EcommercesApi', '$filter', '$window'];

  function EcommerceConfirmController($scope, $state, EcommercesApi, $filter, $window) {
    var vm = this;

    var socketClient = $scope.socketClient;
    var currentJobId = null;
    onCreate();
    vm.card = {};

    function onCreate() {
      vm.municId = $state.params.municId;
      vm.usingId = $state.params.usingId;
      var infoLocal = localStorage.getItem('info_buy');

      handleSubmitOrderResponse();
      if (infoLocal === null || !socketClient) {
        $window.location.replace('/ecommerces');
        // $state.go('company.ecommerces.home', { municId: vm.municId, usingId: vm.usingId });
        return;
      } else {
        try {
          // get data input from pay-follow 2
          vm.data = JSON.parse(infoLocal);
          if (!vm.data.card.is_new_card) {
            // Get card info when use card old
            getCardInfo(vm.data.card.old_card_id);
          }

          // Get using
          getUsing();
          // Cet card
          getCart();

          getMunicInfo();

          // var is_usage_system = vm.data.product_system.is_same_resident !== undefined;
          // console.log(is_usage_system);

        } catch (e) {
          $window.location.replace('/ecommerces');
          // $state.go('company.ecommerces.home', { municId: vm.municId, usingId: vm.usingId });
          return;
        }
      }
    }

    function getUsing() {
      EcommercesApi.getUsingById(vm.municId, vm.usingId)
        .success(function (res) {
          vm.using = res;
        });
    }

    function getCart() {
      EcommercesApi.getCart(vm.municId)
        .success(function (data) {
          vm.cart = data;
          if (!$scope.$$phase) {
            $scope.$digest();
          }
        });
    }

    function getCardInfo(cardId) {
      EcommercesApi.getCardInfo(cardId)
        .success(function (res) {
          vm.card = res;
          vm.card.expire = vm.card.card_expire_date.replace('/', '');
        });
    }

    function getMunicInfo() {
      EcommercesApi.getMunicInfo(vm.municId)
        .success(function (data) {
          vm.municInfo = data;
          if (vm.municInfo && (vm.municInfo.checklist !== '') && !vm.isBack) {
            vm.isSave = false;
          }

          if (vm.municInfo.checklist === undefined || vm.municInfo.checklist === '') {
            vm.isSave = true;
          }
        });
    }


    vm.hashNumberCard = function () {
      if (vm.data.card.is_new_card) {
        vm.card = vm.data.card;
        vm.card.expire = vm.data.card.cart_month + vm.data.card.cart_year;
      }
      var text = '';
      if (vm.card.card_number && vm.card.card_number.length > 4) {
        for (var i = 0; i < vm.card.card_number.length - 4; i++) {
          text += '*';
        }
        text += vm.card.card_number.slice(-4);
      } else {
        text = vm.card.card_number;
      }
      return text;
    };

    vm.getBirthDay = function (apply) {
      return apply.apply_birthday_year + '年' + apply.apply_birthday_month + '月' + apply.apply_birthday_day + '日生まれ';
    };

    vm.submitOrder = function () {
      $scope.handleShowConfirm({
        message: $filter('translate')('ecommerce.confirm.controller.message.confirm_submit')
      }, function () {
        vm.errorMessages = [];
        $scope.handleShowWaiting();
        var body = vm.data;
        body.cartId = vm.cart._id;
        body.usingId = vm.usingId;
        EcommercesApi.submitOrder(body)
          .success(function (res) {
            currentJobId = res;
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            $scope.handleShowToast($scope.parseErrorMessage(error), true);
            return false;
          });
      });
    };

    vm.hashNumberPhone = function (phone) {
      if (phone.length > 4) {
        phone = phone.slice(0, phone.length - 4) + 'XXXX';
      }
      return phone;
    };

    function handleSubmitOrderResponse() {
      if (socketClient) {
        socketClient.on('order_response', function (response) {
          var jobId = response && response.jobId;
          if (currentJobId && currentJobId === jobId) {
            var resultOrder = response && response.result;
            if (resultOrder) {
              $scope.handleCloseWaiting();
              if (resultOrder.success) {
                // Clear info_buy in localStorage to handle back from done page
                localStorage.setItem('info_buy', null);
                $state.go('company.ecommerces.pay-success', { municId: vm.municId });
              } else {
                var errorMessages = resultOrder && resultOrder.errors;
                if (errorMessages && errorMessages.length > 0) {
                  vm.errorMessages = errorMessages;
                  if (!$scope.$$phase) {
                    $scope.$digest();
                  }
                } else {
                  var errorMessage = resultOrder.message || $filter('translate')('common.data.failed');
                  $scope.handleShowToast(errorMessage, true);
                }
              }
            }
          }
        });
      }
    }
  }
}());
