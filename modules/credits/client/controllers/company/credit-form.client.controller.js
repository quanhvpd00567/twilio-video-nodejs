(function () {
  'use strict';

  angular
    .module('credits.admin')
    .controller('CreditFormController', CreditFormController);

  CreditFormController.$inject = ['$scope', '$state', 'CreditsApi', 'ngDialog', 'ngDialog'];

  function CreditFormController($scope, $state, CreditsApi, ngDialog) {
    var vm = this;
    vm.larges = [];
    vm.years = [];
    vm.months = [];
    vm.credit_token = {};
    vm.credit = {};
    vm.is_credit = false;
    onCreate();

    function onCreate() {
      var min = new Date().getFullYear(),
        max = min + 9;

      for (var i = min; i <= max; i++) {
        vm.years.push(i.toString());
      }
      for (var j = 1; j <= 12; j++) {
        var v = j.toString();
        if (j < 10) {
          v = '0' + v;
        }
        vm.months.push(v);
      }

      CreditsApi.credit_token()
        .success(function (data) {
          console.log('~ data', data);
          vm.credit_token = data.token;
        })
        .error(error);

      CreditsApi.credit_info()
        .success(function (cards) {
          vm.cards = cards;
        })
        .error(error);

      function error(err) {
        var message = (err) ? err.message || err.data.message : '項目の取得が失敗しました。';
        $scope.handleShowToast(message, true);
      }
    }

    // Save Store
    vm.save = function (isValid) {
      vm.isSaveClick = true;
      if (!isValid || !validExpiry()) {
        $scope.$broadcast('show-errors-check-validity', 'vm.creditForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: 'クレジットカードを設定します。よろしいですか？'
      }, function () {

        var card_expire = vm.credit.month + '/' + (vm.credit.year + '').slice(-2);
        var data = {
          // '4111111111111111'
          card_number: vm.credit.cardNumber,
          card_expire: card_expire,
          security_code: vm.credit.cvv,
          token_api_key: vm.credit_token,
          lang: 'ja'
        };
        CreditsApi.gentoken_veritrans(data)
          .success(function (data) {
            console.log(data);
            CreditsApi.credit_add(data)
              .success(success)
              .error(error);
          })
          .error(error);
        function success(rs) {
          $state.reload();
          $scope.handleShowToast('クレジットカードの設定が完了しました。');
        }
        function error(err) {
          var message = (err) ? err.message || err.data.message : 'クレジットカードの設定が失敗しました。';
          $scope.handleShowToast(message, true);
        }
      });
    };

    vm.handleExpiryChanged = function (old) {
      if (!validExpiry()) {
        $scope.$broadcast('show-errors-check-validity', 'vm.creditForm');
        return false;
      }
    };

    function validExpiry() {
      if (vm.credit.year && vm.credit.month) {
        var expiryDate = new Date(vm.credit.year + '-' + vm.credit.month + '-00');
        if (expiryDate < new Date()) {
          vm.creditForm.year.$setValidity('expiry', false);
          return false;
        }
      }
      vm.creditForm.year.$setValidity('expiry', true);
      return true;
    }

    vm.remove = function (cardId) {
      $scope.handleShowConfirm({
        message: 'このクレジットカードを削除します。よろしいですか？'
      }, function () {
        CreditsApi.credit_delete(cardId)
          .success(function (rs) {
            $state.reload();
            $scope.handleShowToast('クレジットカードの削除が完了しました。');
          })
          .error(function (err) {
            var message = (err) ? err.message || err.data.message : 'クレジットカードの削除が失敗しました。';
            $scope.handleShowToast(message, true);
          });
      });
    };

    vm.pay = function (card) {

      $scope.card = card;
      $scope.amount = 5000;
      ngDialog.openConfirm({
        templateUrl: '/modules/credits/client/views/company/modal-payment.client.view.html',
        scope: $scope,
        showClose: false,
        closeByDocument: false,
        width: 600,
        controller: ['$scope', function ($scope) {
          vm.payment = function () {
            CreditsApi.credit_pay(card._id, $scope.amount, new Date().valueOf())
              .success(function (rs) {
                console.log('~ rs', rs);

                $scope.handleShowToast('クレジットカードの支払が完了しました。');
              })
              .error(function (err) {
                var message = (err) ? err.message || err.data.message : 'クレジットカードの支払が失敗しました。';
                $scope.handleShowToast(message, true);
              });
          };
        }]
      })
        .then(function (res) {
          delete $scope.card;
        }, function (res) {
          delete $scope.card;
        });
    };
  }
}());
