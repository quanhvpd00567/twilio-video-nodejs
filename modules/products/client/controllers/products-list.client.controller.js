(function () {
  'use strict';

  angular
    .module('products.admin')
    .controller('ProductListController', ProductListController);

  ProductListController.$inject = ['$scope', '$state', '$filter', '$location', 'ProductApi', 'ProductService'];

  function ProductListController($scope, $state, $filter, $location, ProductApi, ProductService) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.listIds = [];
    vm.listIdsAll = [];
    vm.isDisable = true;
    vm.ids = [];
    vm.isCreate = false;
    vm.isEdit = false;
    vm.isDelete = false;
    vm.auth = $scope.Authentication.user;

    // vm.isAdminMunic = $scope.Authentication.user.roles[0] === 'munic_admin';

    console.log();
    var FEATURE_MUNICIPALITY = $scope.masterdata.FEATURE_MUNICIPALITY;

    onCreate();

    function onCreate() {
      init();
      prepareCondition(false);
      vm.condition.municipality = 'all';
      vm.condition.location = 'all';
      handleSearch();

      if (!$scope.isMunicipality) {
        getMunicipality();
      } else {
        getLocationByMunic();
      }
    }

    function init() {
      vm.municipalityId = $state.params.municipalityId;
      vm.key = $state.params.key;
      vm.isNeedAuthorize = $state.params.isNeedAuthorize;
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('products', clear);
      // vm.condition.sort_column = '';
      // vm.condition.sort_direction = '';
      vm.dateOptionsCreatedMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsCreatedMax = { showWeeks: false, minDate: null };
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      vm.listIds = [];
      vm.ids = [];
      vm.listIdsAll = [];

      if (vm.municipalityId) {
        vm.condition.municipalityId = vm.municipalityId;
      }
      ProductApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.products = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('products', vm.condition);
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
      vm.condition.municipality = 'all';
      vm.condition.location = 'all';
      handleSearch();
    };
    vm.handleSortChanged = function (sort_column) {
      vm.condition = $scope.handleSortChanged(vm.condition, sort_column);
      handleSearch();
    };

    /** end handle search, sort & paging */
    vm.remove = function (_id) {
      var messageConfirm = $filter('translate')('products.list.controller.message.confirm_delete');
      if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
        messageConfirm = $filter('translate')('request_item.server.message.confirm_register');
      }
      $scope.handleShowConfirm({
        message: messageConfirm
      }, function () {
        var emplyee = new ProductService({ _id: _id });
        emplyee.$remove(function () {
          handleSearch();
          var message = $filter('translate')('products.list.controller.message.delete_success');
          if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
            message = $filter('translate')('request_item.server.message.save_success');
          }
          $scope.handleShowToast(message);
        }, function (error) {
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
      });
    };

    vm.onChangeCreatedMin = function () {
      vm.dateOptionsCreatedMax.minDate = new Date(vm.condition.created_min);
    };

    vm.onChangeCreatedMax = function () {
      vm.dateOptionsCreatedMin.maxDate = new Date(vm.condition.created_max);
    };

    vm.goToCreate = function () {
      $state.go('admin.products.create');
    };

    function getMunicipality() {
      ProductApi.getMunicipalityAll()
        .success(function (res) {
          vm.municipalities = res;
          console.log(vm.municipalities);
        });
    }

    function getLocationByMunic() {
      vm.locations = [];
      if ($scope.isMunicipality) {
        vm.condition.municipality = $scope.Authentication.user.municipalityId;
      }
      ProductApi.getLocationByMunic(vm.condition.municipality)
        .success(function (res) {
          vm.locations = res;
          if (vm.locations.length === 0) {
            vm.condition.location = 'all';
          }
        });
    }

    vm.onChangeMunic = function () {
      getLocationByMunic();
    };
  }
}());
