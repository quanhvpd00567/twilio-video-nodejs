(function () {
  'use strict';

  angular
    .module('requests_registration.admin')
    .controller('RequestRegisterAdminListController', RequestRegisterAdminListController);

  RequestRegisterAdminListController.$inject = ['$scope', '$stateParams', 'RequestRegistrationApi', '$filter', '$location'];

  function RequestRegisterAdminListController($scope, $stateParams, RequestRegistrationApi, $filter, $location) {
    var vm = this;
    var originItem = null;
    vm.CompanyFeatures = $scope.masterdata.features_company;
    vm.MunicFeatures = $scope.masterdata.features_municipality;
    vm.feature_autho_types = $scope.masterdata.feature_autho_types;
    var ALL_ID = 'all';
    vm.features_authorized = [];
    var FEATURE_MUNICIPALITY = $scope.masterdata.FEATURE_MUNICIPALITY;

    onCreate();

    function onCreate() {
      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('reuqests', clear);
      vm.condition.sort_column = 'updated';
      vm.condition.sort_direction = '-';
      vm.condition.limit = 10;
    }

    function handleSearch(isShowingWaiting) {
      vm.features_authorized = [];
      vm.type = null;
      vm.munic_id = null;
      vm.company_id = null;
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      RequestRegistrationApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.requests = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('reuqests', vm.condition);
          $scope.handleCloseWaiting();
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    /** start handle search, sort & paging */
    vm.handleConditionChange = function () {
      vm.isChanged = true;
    };
    vm.handleConditionChanged = function (changed) {
      if (changed || vm.isChanged) {
        vm.isChanged = false;
        vm.condition.page = 1;
        handleSearch();
      }
    };

    vm.handlePageChanged = function () {
      handleSearch();
    };
    vm.handleClearCondition = function () {
      prepareCondition(true);
      handleSearch();
    };
    vm.handleSortChanged = function (sort_column) {
      vm.condition = $scope.handleSortChanged(vm.condition, sort_column);
      handleSearch();
    };

    /** end handle search, sort & paging */

    vm.onShowFeatures = function (item) {
      vm.features_authorized = item.features_authorized;
      vm.type = item.type;
      if (vm.type === 'company') {
        vm.company_id = item.company_id;
        vm.munic_id = null;
      } else {
        vm.munic_id = item.munic_id;
        vm.company_id = null;
      }
    };

    vm.getNameFeature = function (item) {
      var feature = undefined;
      if (vm.type === 'company') {
        feature = vm.CompanyFeatures.find(function (element) { return element.id === item; });
      } else {
        feature = vm.MunicFeatures.find(function (element) { return element.id === item; });
      }

      if (feature !== undefined) {
        if (vm.type === 'company') {
          return feature.value;
        }
        return feature.value;
      }
      return '';
    };

    vm.getNamePath = function (item) {

      var feature = undefined;
      var queryString = '?companyId=' + vm.company_id;
      if (vm.type === 'municipality') {
        feature = vm.MunicFeatures.find(function (element) { return element.id === item.feature; });
        queryString = '?municipalityId=' + vm.munic_id;
        queryString += '&key=' + feature.id;
        queryString += '&isNeedAuthorize=' + item.is_need_authorize;

      } else {
        feature = vm.CompanyFeatures.find(function (element) { return element.id === item.feature; });
        queryString += '&key=' + feature.id;
      }

      if (feature !== undefined) {
        return '/' + feature.path + queryString;
      }

      return '';
    };

    // vm.onRedirectPage = function (item) {
    //   var path = vm.getNamePath(item);
    //   if (vm.company_id && item === 'create_product') {
    //     // todo check has using before redirect page
    //     // $window.location.href = path;
    //     $location.path('?' + path);
    //     return;
    //   }
    //   $location.path('?' + path);
    //   // $window.location.href = path;
    //   return;
    // };
  }
}());
