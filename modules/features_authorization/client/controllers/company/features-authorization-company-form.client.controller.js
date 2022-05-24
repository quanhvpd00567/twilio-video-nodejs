(function () {
  'use strict';

  angular
    .module('features_authorization.company')
    .controller('FeaturesAuthorizationFormCompanyController', FeaturesAuthorizationFormCompanyController);

  FeaturesAuthorizationFormCompanyController.$inject = ['$scope', '$stateParams', 'FeaturesAuthorizationApi', '$filter'];

  function FeaturesAuthorizationFormCompanyController($scope, $stateParams, FeaturesAuthorizationApi, $filter) {
    var vm = this;
    var originItem = null;
    vm.features = [];
    var ALL_ID = 'all';
    vm.ALL_ID = ALL_ID;
    vm.allItem = null;
    onCreate();

    function onCreate() {
      vm.features = JSON.parse(JSON.stringify($scope.masterdata.features_company));
      initData();
    }

    function initData() {
      $scope.handleShowWaiting();
      FeaturesAuthorizationApi.get()
        .success(function (res) {
          $scope.handleCloseWaiting();

          if (res) {
            originItem = res;
            var featuresAuthorized = res.features_authorized.map(function (item) { return item.feature; });
            vm.features = _.map(vm.features, function (feature) {
              feature.isChecked = featuresAuthorized.indexOf(feature.id) !== -1;
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

    // Handle update company
    vm.update = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.featureForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('features_authorization.company_form.controller.message.confirm_save')
      }, function () {
        var featuresSelected = _.filter(vm.features, function (feature) {
          return feature.id !== ALL_ID && feature.isChecked;
        });
        var features_authorized = _.map(featuresSelected, function (item) {
          return { feature: item.id };
        });
        if (originItem) {
          originItem.features_authorized = features_authorized;
        } else {
          originItem = { features_authorized: features_authorized };
        }

        $scope.handleShowWaiting();
        // vm.company = new
        FeaturesAuthorizationApi.update(originItem)
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          var message = $filter('translate')('features_authorization.company_form.controller.message.save_success');
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('features_authorization.company_form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        }
      });
    };

    vm.onCheckFeature = function (item) {
      if (item.id === ALL_ID) {
        if (item.isChecked) {
          vm.features = _.map(vm.features, function (item) {
            item.isChecked = true;
            return item;
          });
        } else {
          vm.features = _.map(vm.features, function (item) {
            item.isChecked = false;
            return item;
          });
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
      allItem.isChecked = otherItems.every(function (item) {
        return item.isChecked;
      });
    }
  }
}());
