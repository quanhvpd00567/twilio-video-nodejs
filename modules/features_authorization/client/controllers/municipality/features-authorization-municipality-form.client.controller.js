(function () {
  'use strict';

  angular
    .module('features_authorization.municipality')
    .controller('FeaturesAuthorizationFormMunicipalityController', FeaturesAuthorizationFormMunicipalityController);

  FeaturesAuthorizationFormMunicipalityController.$inject = ['$scope', 'FeaturesAuthorizationApi', '$filter'];

  function FeaturesAuthorizationFormMunicipalityController($scope, FeaturesAuthorizationApi, $filter) {
    var vm = this;
    var originItem = null;
    vm.features = [];
    var ALL_ID = 'all';
    vm.ALL_ID = ALL_ID;
    vm.allItem = null;
    vm.errorFeatures = [];

    vm.OPTION_TYPE = {
      NEED_AUTHORIZE: 'need_authorize',
      NO_NEED_AUTHORIZE: 'no_need_authorize'
    };
    onCreate();

    function onCreate() {
      vm.features = JSON.parse(JSON.stringify($scope.masterdata.features_municipality));
      initData();
    }

    function initData() {
      $scope.handleShowWaiting();
      FeaturesAuthorizationApi.get()
        .success(function (res) {
          $scope.handleCloseWaiting();
          if (res) {
            originItem = res;
            vm.features = _.map(vm.features, function (feature) {
              var item = res.features_authorized.find(function (item) { return item.feature === feature.id; });
              feature.isCheckedNeedAuthorize = item && item.is_need_authorize;
              feature.isCheckedNoNeedAuthorize = item && !item.is_need_authorize;
              return feature;
            });
          }

          vm.features.unshift({ id: ALL_ID, value: $filter('translate')('features_authorization.form.select_all_function.label') });
          checkForCheckAllOption();
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    // Handle update
    vm.update = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.featureForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('features_authorization.municipality_form.controller.message.confirm_save')
      }, function () {
        vm.errorFeatures = [];
        var featuresSelected = _.filter(vm.features, function (feature) {
          return feature.id !== ALL_ID && (feature.isCheckedNeedAuthorize || feature.isCheckedNoNeedAuthorize);
        });
        var features_authorized = _.map(featuresSelected, function (item) {
          return { feature: item.id, is_need_authorize: item.isCheckedNeedAuthorize };
        });
        if (originItem) {
          originItem.features_authorized = features_authorized;
        } else {
          originItem = { features_authorized: features_authorized };
        }

        $scope.handleShowWaiting();
        FeaturesAuthorizationApi.update(originItem)
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          var message = $filter('translate')('features_authorization.municipality_form.controller.message.save_success');
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();

          if (error && error.data && error.data.featuresErrorExisting) {
            vm.errorFeatures = [];
            vm.errorFeatures = _.map(error.data.featuresErrorExisting, function (feature) {
              return $scope.showMasterValue($scope.masterdata.features_municipality, feature);
            });
            var a = 1;
          } else {
            var message = error && error.data && error.data.message || $filter('translate')('features_authorization.municipality_form.controller.message.save_failed');
            $scope.handleShowToast(message, true);
          }
        }
      });
    };

    vm.onCheckFeature = function (item, option) {
      if (option === vm.OPTION_TYPE.NEED_AUTHORIZE) {
        if (item.isCheckedNeedAuthorize) {
          item.isCheckedNoNeedAuthorize = false;
        }
      } else {
        if (item.isCheckedNoNeedAuthorize) {
          item.isCheckedNeedAuthorize = false;
        }
      }

      if (item.id === ALL_ID) {
        if (option === vm.OPTION_TYPE.NEED_AUTHORIZE) {
          if (item.isCheckedNeedAuthorize) {
            vm.features = _.map(vm.features, function (item) {
              item.isCheckedNoNeedAuthorize = false;
              if (!item.isOnlyNoNeedAuthorize) {
                item.isCheckedNeedAuthorize = true;
              } else {
                item.isCheckedNoNeedAuthorize = true;
              }
              return item;
            });
          } else {
            vm.features = _.map(vm.features, function (item) {
              item.isCheckedNeedAuthorize = false;
              if (item.isOnlyNoNeedAuthorize) {
                item.isCheckedNoNeedAuthorize = false;
              }
              return item;
            });
          }
        } else {
          if (item.isCheckedNoNeedAuthorize) {
            vm.features = _.map(vm.features, function (item) {
              item.isCheckedNoNeedAuthorize = true;
              item.isCheckedNeedAuthorize = false;
              return item;
            });
          } else {
            vm.features = _.map(vm.features, function (item) {
              item.isCheckedNoNeedAuthorize = false;
              return item;
            });
          }
        }
      } else {
        checkForCheckAllOption();
      }
    };

    function checkForCheckAllOption() {
      var allItem = _.find(vm.features, function (item) {
        return item.id === ALL_ID;
      });
      vm.allItem = allItem;
      var otherItems = _.filter(vm.features, function (item) {
        return item.id !== ALL_ID;
      });
      // allItem.isCheckedNeedAuthorize = otherItems.every(function (item) {
      //   return item.isCheckedNeedAuthorize || item.isOnlyNoNeedAuthorize;
      // });
      allItem.isCheckedNoNeedAuthorize = otherItems.every(function (item) {
        return item.isCheckedNoNeedAuthorize;
      });
    }
  }
}());
