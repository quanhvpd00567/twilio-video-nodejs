(function () {
  'use strict';

  angular
    .module('products.municipality')
    .controller('ProductListController', ProductListController);

  ProductListController.$inject = ['$scope', '$state', '$filter', '$location', 'ProductApi', 'ProductService', 'RequestRegistrationApi'];

  function ProductListController($scope, $state, $filter, $location, ProductApi, ProductService, RequestRegistrationApi) {
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

    vm.isAdminMunic = $scope.Authentication.user.roles[0] === 'munic_admin';
    var FEATURE_MUNICIPALITY = $scope.masterdata.FEATURE_MUNICIPALITY;

    onCreate();

    function onCreate() {
      init();
      prepareCondition(false);
      handleSearch();
    }

    function init() {
      vm.municipalityId = $state.params.municipalityId;
      vm.key = $state.params.key;
      vm.isNeedAuthorize = $state.params.isNeedAuthorize;
      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && !vm.municipalityId && !vm.key) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }

      if (vm.municipalityId && vm.key) {
        vm.isCreate = vm.key === FEATURE_MUNICIPALITY.CREATE_PRODUCT;
        vm.isEdit = vm.key === FEATURE_MUNICIPALITY.UPDATE_PRODUCT;
        vm.isDelete = vm.key === FEATURE_MUNICIPALITY.DELETE_PRODUCT;
      } else {
        vm.isCreate = true;
        vm.isEdit = true;
        vm.isDelete = true;
      }
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('members', clear);
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
          $scope.conditionFactoryUpdate('members', vm.condition);
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
      $state.go('municipality.products.create');
    };
  }
}());
