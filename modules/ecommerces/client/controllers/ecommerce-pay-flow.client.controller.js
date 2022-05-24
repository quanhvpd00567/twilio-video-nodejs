(function () {
  'use strict';

  angular
    .module('ecommerces.company')
    .controller('EcommercePayFlowController', EcommercePayFlowController);

  EcommercePayFlowController.$inject = ['$scope', '$state', 'EcommercesApi', 'CreditsApi'];

  function EcommercePayFlowController($scope, $state, EcommercesApi, CreditsApi) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.usings = [];
    vm.isError = false;
    vm.usingSelected = '';
    vm.prefectures = vm.master.prefectures;
    vm.data = {
      info: {},
      docs: {},
      apply: {},
      card: {},
      info_contact: {},
      products: {},
      product_system: {}
    };
    vm.listProductId = [];
    vm.isBack = false;
    vm.isSave = true;
    vm.params = {};

    onCreate();

    function onCreate() {
      vm.municId = $state.params.municId;

      // check current screen is pay follow 1 or pay follow 2
      checkFollowPayment();
      var hasBack = $state.params.isBack;
      if (vm.isFollow2) {
        vm.listProductId = [];
        vm.usingId = $state.params.usingId;

        if (hasBack && hasBack !== '1') {
          localStorage.removeItem('info_buy');
        }
        vm.params = {
          municId: vm.municId,
          using: vm.usingId
        };

        var infoLocal = localStorage.getItem('info_buy');
        if (infoLocal !== null && hasBack === '1') {
          vm.isBack = true;
          vm.data = JSON.parse(infoLocal);
          vm.params.isBack = 1;

          // Progress show address info by product
          Object.keys(vm.data.products).forEach(function (key) {
            var mode = vm.data.products[key].is_same_resident;
            if (mode === '2') {
              vm.listProductId.push(key);
            }

            if (!vm.data.products[key].is_show_note_address) {
              vm.data.products[key].note_detail_address = '';
            }
          });
        } else {
          // set default data
          vm.data.docs.doc_is_same_resident = 1;
          vm.data.product_system.is_same_resident = 1;
          vm.data.apply.apply_is_need = 2;
          vm.data.apply.apply_sex = 1;
        }

        vm.currentYear = (new Date).getFullYear();


        // Get munic
        getMunicInfo();
        // Get list card
        getListCard();

        if (!vm.isBack) {
          // Get lastest order
          getLastestOrder();
        }


        CreditsApi.credit_token()
          .success(function (data) {
            vm.credit_token = data.token;
          })
          .error(error);

      } else {
        // Get list using if current screen is pay follow 1
        getListUsing();
        getMunicInfo();
        if ($state.params.using) {
          vm.usingSelected = $state.params.using;
        }
      }
    }


    function getListUsing() {
      var municId = $state.params.municId;
      EcommercesApi.getUsingMunic(municId)
        .success(function (res) {
          vm.usings = res;
        })
        .error(function (params) {

        });
    }

    function error(err) {
      var message = (err) ? err.message || err.data.message : '項目の取得が失敗しました。';
      $scope.handleShowToast(message, true);
    }

    vm.onChangeUsing = function (value) {
      if (vm.usingSelected) {
        vm.isError = false;
      }
    };

    vm.onClickRedirectToFollow2 = function () {
      if (vm.isFollow2)
        return;
      if (!vm.usingSelected) {
        vm.isError = true;
        return;
      }
      var municId = $state.params.municId;

      // Redirect to screen pay follow 2
      var params = { municId: municId, usingId: vm.usingSelected };
      if ($state.params.isBack && $state.params.isBack === '1') {
        params.isBack = 1;
      }
      $state.go('company.ecommerces.pay2', params);
    };

    vm.addInfo = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        vm.isChangeIsDocSameResident2 = true;
        vm.isChangeIsNeed2 = true;
        vm.isChangeNewCard = true;

        vm.listProductId.map(function (item) {
          vm.data.products[item].is_show_error = true;
          return true;
        });


        $scope.$broadcast('show-errors-check-validity', 'vm.follow2Info');
        return false;
      }

      // Check mapping munic
      if (vm.municInfo.prefecture === vm.data.prefecture && vm.data.city.includes(vm.municInfo.name)) {
        vm.isMappingMunicError = true;
        $scope.handleShowToast('住民票に記載されている自治体には寄付できません。', true);
        return false;
      } else {
        vm.isMappingMunicError = false;
      }

      // $scope.handleShowConfirm({
      //   message: 'クレジットカードを設定します。よろしいですか？'
      // }, function () {

      if (vm.municInfo.is_usage_system === 1) {
        vm.cart.products.map(function (itemCart) {
          vm.data.products[itemCart.product._id].is_same_resident = vm.data.product_system.is_same_resident;
          vm.data.products[itemCart.product._id].accepted_schedule = vm.data.product_system.accepted_schedule;
          if (vm.data.product_system.is_same_resident === '2') {
            vm.data.products[itemCart.product._id].last_name = vm.data.product_system.last_name;
            vm.data.products[itemCart.product._id].first_name = vm.data.product_system.first_name;
            vm.data.products[itemCart.product._id].last_name_kana = vm.data.product_system.last_name_kana;
            vm.data.products[itemCart.product._id].first_name_kana = vm.data.product_system.first_name_kana;
            vm.data.products[itemCart.product._id].zipcode = vm.data.product_system.zipcode;
            vm.data.products[itemCart.product._id].prefecture = vm.data.product_system.prefecture;
            vm.data.products[itemCart.product._id].city = vm.data.product_system.city;
            vm.data.products[itemCart.product._id].address = vm.data.product_system.address;
            vm.data.products[itemCart.product._id].building = vm.data.product_system.building;
            vm.data.products[itemCart.product._id].tel = vm.data.product_system.tel;
          }
          return true;
        });
        vm.data.is_usage_system = 1;
      } else {
        vm.data.product_system = {};
        vm.data.is_usage_system = 2;
      }

      if (vm.data.card.is_new_card) {
        var card_expire = vm.data.card.cart_month + '/' + (vm.data.card.cart_year + '').slice(-2);
        var data = {
          // '4111111111111111'
          card_number: vm.data.card.card_number,
          card_expire: card_expire,
          security_code: vm.data.card.card_cvv,
          token_api_key: vm.credit_token,
          lang: 'ja'
        };

        if (!vm.municInfo.is_setting_docs) {
          vm.data.docs.is_same_resident = 1;
        }
        CreditsApi.gentoken_veritrans(data)
          .success(function (data) {
            if (vm.data.card.is_save_card) {
              EcommercesApi.addCard(data)
                .success(success)
                .error(error);
            } else {
              vm.messageCard = '';

              // Save token from veritran to handle authorize and get CardId from veritran to payment
              vm.data.card.token = data.token;
              vm.data.card.token_expire_date = data.token_expire_date;
              // Save local storage
              localStorage.setItem('info_buy', JSON.stringify(vm.data));
              $state.go('company.ecommerces.pay-confirm', { municId: vm.municId, usingId: vm.usingId });
            }
          })
          .error(error);
      } else {
        // Save local storage
        localStorage.setItem('info_buy', JSON.stringify(vm.data));
        $state.go('company.ecommerces.pay-confirm', { municId: vm.municId, usingId: vm.usingId });
      }

      function success(rs) {
        vm.data.card = {};
        vm.data.card.is_new_card = false;
        vm.data.card.old_card_id = rs._id;

        vm.messageCard = '';
        // Save local storage
        localStorage.setItem('info_buy', JSON.stringify(vm.data));
        $state.go('company.ecommerces.pay-confirm', { municId: vm.municId, usingId: vm.usingId });
      }
      function error(err) {
        var message = (err) ? err.message || err.data.message : 'クレジットカードの設定が失敗しました。';
        if (err.status === 'failure' && err.code) {
          switch (err.code) {
            case 'digit_check_error':
              message = 'カード番号が間違っています。';
              break;
            case 'invalid_card_number':
              message = 'カード番号の書式に誤りがあります。';
              break;
          }
        }
        vm.messageCard = message;
        $scope.handleShowToast(message, true);
      }
      // });
    };

    function checkFollowPayment() {
      var municId = $state.params.municId;
      var usingId = $state.params.usingId;
      vm.isFollow2 = false;
      if (municId && usingId) {
        vm.isFollow2 = true;
      }
    }

    vm.getAddressByZipcode = function (zipcode, type, $index) {
      if (zipcode !== undefined && zipcode.length === 7) {
        $scope.handleShowWaiting();
        EcommercesApi.getAddressByZipcode(zipcode)
          .success(function (params) {
            if (params) {
              if (type === 'resident') {
                vm.data.prefecture = params.prefecture;
                vm.data.city = params.city + params.town;
              }

              if (type === 'tax_info') {
                vm.data.docs.doc_add_prefecture = params.prefecture;
                vm.data.docs.doc_add_city = params.city + params.town;
              }

              if (type === 'product') {
                vm.data.products[$index].prefecture = params.prefecture;
                vm.data.products[$index].city = params.city + params.town;
              }

              if (type === 'product_system') {
                vm.data.product_system.prefecture = params.prefecture;
                vm.data.product_system.city = params.city + params.town;
              }
            }

            $scope.handleCloseWaiting();
          });
      }
    };

    vm.onChangeIsDocSameResident = function (value) {
      if (value === 1) {
        vm.data.docs = {};
      } else {
        vm.isChangeIsDocSameResident2 = false;
      }
      vm.data.docs.doc_is_same_resident = value;
    };

    vm.onChangeIsNeed = function (value) {
      if (value === 1) {
        vm.data.apply = {};
        if (vm.municInfo.checklist === '' || vm.municInfo.checklist === undefined) {
          vm.isSave = true;
        }

        if (vm.data.is_accept_term) {
          vm.isSave = true;
        }
      }

      if (value === 2) {
        vm.data.apply.apply_sex = 1;
        vm.isChangeIsNeed2 = false;
        vm.isSave = false;
      }

      vm.data.apply.apply_is_need = value;
    };

    vm.onApplyIsAccept = function () {
      if (vm.data.apply.apply_is_need === 2 && vm.municInfo.checklist) {
        vm.isSave = (vm.data.is_accept_term && vm.data.apply.apply_is_accept);
      }

      if (vm.data.apply.apply_is_need === 2 && (vm.municInfo.checklist === '' || vm.municInfo.checklist === undefined)) {
        vm.isSave = vm.data.apply.apply_is_accept;
      }
    };

    vm.onChangeApplySex = function (value) {
      // if (value === 1) {
      //   vm.data.apply = {};
      // }
      vm.data.apply.apply_sex = value;
    };

    vm.onChangeCard = function (value) {
      if (value === '') {
        vm.data.card.is_new_card = true;
        vm.data.card.old_card_id = '';
        vm.isChangeNewCard = false;
      } else {
        vm.data.card = {};
        vm.data.card.is_new_card = false;
        vm.data.card.old_card_id = value;
      }
    };

    vm.getOptionSchedules = function (options) {
      var optionDefault = ['指定なし'];

      options.map(function (item, index) {
        optionDefault.push(item);
        return item;
      });

      return optionDefault;
    };

    vm.onProductChangeAddress = function (productId, type) {
      if (type === 'new') {
        if (!vm.listProductId.includes(productId)) {
          vm.listProductId.push(productId);
        }
        vm.data.products[productId].is_show_error = false;
      }

      if (type === 'old') {
        if (vm.listProductId.includes(productId)) {
          // remove
          var index = vm.listProductId.indexOf(productId);
          if (index !== -1) {
            vm.listProductId.splice(index, 1);
            var object = vm.data.products[productId];
            vm.data.products[productId] = {};

            vm.data.products[productId].is_show_note_address = object.is_show_note_address;
            vm.data.products[productId].note_detail_address = object.note_detail_address;
            vm.data.products[productId].accepted_schedule = object.accepted_schedule;
          }
        }
        vm.data.products[productId].is_same_resident = 1;
      }
    };

    function getLastestOrder() {
      EcommercesApi.getOrderLatest()
        .success(function (res) {
          if (res) {
            vm.data.info.last_name = res.last_name;
            vm.data.info.last_name_kana = res.last_name_kana;
            vm.data.info.first_name = res.first_name;
            vm.data.info.first_name_kana = res.first_name_kana;
            vm.data.info_contact.phone = res.tel;
            vm.data.info_contact.email = res.email;
            vm.data.info_contact.email_confirm = res.email;
            vm.data.zipcode = res.zip_code;
            vm.data.prefecture = res.prefecture;
            vm.data.city = res.city;
            vm.data.address = res.address;
            vm.data.building = res.building;
          }
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

          vm.data.apply.apply_is_need = vm.municInfo.is_apply_need;
          if (vm.municInfo.is_apply_need === undefined || vm.municInfo.is_apply_need === '') {
            vm.municInfo.is_apply_need = 2;
            vm.data.apply.apply_is_need = 2;
          }

          if (!vm.isBack && (vm.municInfo.is_usage_system === 1)) {
            vm.data.product_system.is_same_resident = 1;
          }

          if (vm.isFollow2) {
            // Get cart if current screen is pay follow 2
            getCart();
          }
        });
    }

    function getListCard() {
      EcommercesApi.getListCard()
        .success(function (data) {
          vm.cards = data;
          if (vm.cards.length === 0 && !vm.isBack) {
            vm.data.card.is_new_card = true;
            vm.data.card.old_card_id = '';
          }
          if (vm.cards.length > 0 && !vm.isBack) {
            vm.data.card.old_card_id = vm.cards[0]._id;
            vm.data.card.is_new_card = false;
          }
        });
    }

    function getCart() {
      EcommercesApi.getCart(vm.municId)
        .success(function (data) {
          vm.cart = data;
          // Set default
          if (vm.cart.products.length > 0 && !vm.isBack) {
            vm.cart.products.map(function (item) {
              vm.data.products[item.product._id] = {};
              vm.data.products[item.product._id].is_same_resident = 1;
              if (item.product.is_accept_schedule === 2) {
                vm.data.products[item.product._id].accepted_schedule = '指定なし';
              }
              return true;
            });
          }

          if (vm.municInfo.is_usage_system === 1) {
            getListDateShip();
          }
        });
    }

    vm.hashNumberCard = function (card) {
      var text = '';
      if (card.length > 2) {
        for (var i = 0; i < card.length - 2; i++) {
          text += '*';
        }
        text += card.slice(-2);
      } else {
        text = card;
      }
      return text;
    };

    vm.onAcceptTerm = function () {
      if (vm.data.is_accept_term) {
        if (vm.data.apply.apply_is_need === 2) {
          if (vm.data.apply.apply_is_accept) {
            vm.isSave = true;
          } else {
            vm.isSave = false;
          }
          return;
        }
        vm.isSave = vm.data.is_accept_term;
        return;
      } else {
        vm.isSave = false;
      }
    };

    vm.onRemoveCard = function (card_id) {
      $scope.handleShowConfirm({
        message: 'このクレジットカードを削除します。よろしいですか？'
      }, function () {
        EcommercesApi.removeCard(card_id)
          .success(function (res) {
            if (res.status) {
              getListCard();
              vm.messageCard = '';
              $scope.handleShowToast('クレジットカードの削除が完了しました');
            }
          })
          .error(function (err) {
            var message = (err) ? err.message || err.data.message : 'クレジットカードの設定が失敗しました。';
            vm.messageCard = message;
            $scope.handleShowToast(message, true);
          });
      });
    };

    vm.onProductChangeShowNote = function (productId) {
      if (!vm.data.products[productId].is_show_note_address) {
        vm.data.products[productId].note_detail_address = '';
      }
    };

    function getListDateShip() {
      vm.isProductSchedule = false;
      vm.scheduleTime = [];
      vm.arrLengthSchedule = [];
      vm.isSame = false;

      if (vm.cart.products.length > 0) {
        vm.cart.products.map(function (item) {
          if (item.product.is_accept_schedule === 1) {
            vm.isProductSchedule = true;
          }
          if (item.product.is_accept_schedule === 2) {
            var xxx = item.product.accepted_schedule.map(function (x) {
              var text = '';
              switch (x) {
                case '12:00 ～ 14:00':
                case '16:00 ～ 18:00':
                case '14:00 ～ 16:00':
                  text = '午後';
                  break;
                case '18:00 ～ 20:00':
                case '19:00 ～ 21:00':
                case '20:00 ～ 21:00':
                case '18:00 ～ 21:00':
                  text = '夜間';
                  break;
                default:
                  text = '午前中';
                  break;
              }

              return text;
            });
            xxx = xxx.filter(function (value, index, self) {
              return self.indexOf(value) === index;
            });

            vm.arrLengthSchedule.push(xxx.length);
            vm.scheduleTime.push(xxx);
          }

          return true;
        });
      }
      if (vm.cart.products.length > 1) {
        vm.scheduleTime = getListSchedule(vm.scheduleTime);
        // if (checkArrayEqual(vm.arrLengthSchedule)) {
        //   var firstItem = vm.scheduleTime[0];
        //   if (firstItem.length === 3) {
        //     vm.scheduleTime = firstItem;
        //   } else {
        //     for (var i = 1; i < vm.scheduleTime.length; i++) {
        //       vm.isSame = _.isEqual(firstItem, vm.scheduleTime[i]);
        //     }
        //     if (vm.isSame) {
        //       vm.scheduleTime = firstItem;
        //     } else {
        //       vm.scheduleTime = [];
        //     }
        //   }
        // } else {
        //   vm.scheduleTime = [];
        // }
      } else {
        vm.scheduleTime = vm.scheduleTime[0];
      }

      if (!vm.isBack) {
        vm.data.product_system.accepted_schedule = '指定なし';
      }
    }

    function checkArrayEqual(arr) {
      return arr.every(function (v) {
        return v === arr[0];
      });
    }


    function getListSchedule(arrays) {
      var result = arrays.shift().filter(function (v) {
        return arrays.every(function (a) {
          return a.indexOf(v) !== -1;
        });
      });

      return result;
    }
  }
}());
