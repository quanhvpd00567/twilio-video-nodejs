(function () {
  'use strict';

  angular
    .module('ecommerces.company')
    .controller('EcommerceHistoryDetailController', EcommerceHistoryDetailController);

  EcommerceHistoryDetailController.$inject = ['$scope', '$stateParams', '$state', '$filter', 'EcommercesApi'];

  function EcommerceHistoryDetailController($scope, $stateParams, $state, $filter, EcommercesApi) {
    var vm = this;
    vm.orderId = $stateParams.orderId;

    onCreate();

    function onCreate() {
      getOrder(vm.orderId);
    }

    function getOrder(orderId) {
      $scope.handleShowWaiting();
      EcommercesApi.getOrderDetail(orderId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.order = res;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
          $state.go('company.ecommerces.history');
        });
    }

    vm.getBirthDay = function (apply) {
      if (!apply) {
        return '';
      }

      if (apply.apply_birthday) {
        var days = apply.apply_birthday.split('/');
        return days[0] + '年' + days[1] + '月' + days[2] + '日生まれ';
      }

    };

    vm.getName = function (item) {
      var name = [item.last_name, item.first_name].join(' ').trim();
      var nameKana = [item.last_name_kana, item.first_name_kana].join(' ').trim();

      if (nameKana) {
        return name + '/' + nameKana;
      }

      return name.trim();
    };

    vm.getAddress = function (item) {
      return (item.prefecture || '') + (item.city || '') + (item.address || '') + (item.building || '');
    };

    vm.hashNumberPhone = function (phone) {
      // if (phone.length > 4) {
      //   phone = phone.slice(0, phone.length - 4) + 'XXXX';
      // }
      return phone;
    };
  }
}());
