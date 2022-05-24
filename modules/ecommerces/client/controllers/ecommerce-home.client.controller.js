(function () {
  'use strict';

  angular
    .module('ecommerces.company')
    .controller('EcommerceHomeController', EcommerceHomeController);

  EcommerceHomeController.$inject = ['$scope', 'EcommercesApi', '$q', '$filter', '$state', 'CartsApi'];

  function EcommerceHomeController($scope, EcommercesApi, $q, $filter, $state, CartsApi) {
    var vm = this;

    vm.exchangeRate = {
      300: { 1: 28000, 2: 19000, 3: 11000, 4: 19000 },
      350: { 1: 34000, 2: 25000, 3: 17000, 4: 28000 },
      400: { 1: 43000, 2: 33000, 3: 25000, 4: 36000 },
      450: { 1: 53000, 2: 41000, 3: 32000, 4: 45000 },
      500: { 1: 61000, 2: 49000, 3: 40000, 4: 59000 },
      550: { 1: 70000, 2: 61000, 3: 49000, 4: 68000 },
      600: { 1: 77000, 2: 68000, 3: 60000, 4: 78000 },
      650: { 1: 98000, 2: 76000, 3: 68000, 4: 100000 },
      700: { 1: 109000, 2: 85000, 3: 77000, 4: 111000 },
      750: { 1: 120000, 2: 109000, 3: 87000, 4: 122000 },
      800: { 1: 131000, 2: 120000, 3: 111000, 4: 134000 },
      850: { 1: 141000, 2: 130000, 3: 120000, 4: 146000 },
      900: { 1: 153000, 2: 141000, 3: 132000, 4: 158000 },
      950: { 1: 165000, 2: 153000, 3: 144000, 4: 172000 },
      1000: { 1: 177000, 2: 165000, 3: 156000, 4: 185000 },
      1500: { 1: 384000, 2: 380000, 3: 368000 },
      2000: { 1: 552000, 2: 546000, 3: 534000 },
      3000: { 1: 1034000, 2: 1027000, 3: 1013000 },
      5000: { 1: 2056000, 2: 2046000, 3: 2031000 },
      10000: { 1: 4316000, 2: 4312000, 3: 4297000 }
    };

    vm.products = [];
    vm.salary;
    vm.salary_status;
    vm.isEmptyProduct = true;

    vm.latestNotices = [];
    vm.municipalitiesHasActivePoints = [];
    vm.groupMunicPoints = {};
    vm.groupMunic = [];
    onCreate();

    function onCreate() {
      $scope.handleShowWaiting();
      initData();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('ecommerce-products', clear);
      vm.condition.limit = 8;
      if (!vm.condition.sort_option) {
        vm.condition.sort_option = 0;
      }
    }

    function handleSearch() {
      EcommercesApi.getProducts(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          var products = res.docs.map(function (item) {
            var discount = Math.floor(vm.groupMunicPoints[item.muniObject._id] || 0);
            var max_point = res.configObject && res.configObject.max_point || 20;
            var usableDiscount = Math.floor(item.price / 100 * max_point);
            item.price_discount = item.price - (discount > usableDiscount ? usableDiscount : discount);
            return item;
          });
          vm.products = products;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          vm.condition.nextPage = res.nextPage;
          vm.isEmptyProduct = !products.length;
          $scope.conditionFactoryUpdate('members', vm.condition);
          $scope.handleCloseWaiting();
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    function initData() {
      var clear = !isBackFromProductDetail();
      $q.all([get3LatestNotices(true), getMunicipalitiesHasActivePoints(true)]).then(function () {
        prepareCondition(clear);
        handleSearch();
      }).catch(function (error) {
        var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
        $scope.handleShowToast(message, true);
      });
    }

    function get3LatestNotices() {
      return EcommercesApi.get3LatestNotices()
        .success(function (res) {
          vm.latestNotices = res || [];
          return true;
        })
        .error(function (error) {
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
          return false;
        });
    }

    function getMunicipalitiesHasActivePoints() {
      return EcommercesApi.getMunicipalitiesHasActivePoints()
        .success(function (res) {
          vm.municipalitiesHasActivePoints = res || [];
          vm.groupMunicPoints = vm.municipalitiesHasActivePoints.reduce(function (data, item) {
            if (data[item.municipality_id]) {
              data[item.municipality_id] += item.points;
            } else {
              data[item.municipality_id] = item.points;
            }
            return data;
          }, {});
          vm.groupMunic = vm.municipalitiesHasActivePoints.filter(function (item, index, self) {
            return self.findIndex(function (i) { return i.municipality_id === item.municipality_id; }) === index;
          });

          return true;
        })
        .error(function (error) {
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
          return false;
        });
    }

    vm.getPointDiscount = function () {
      return vm.exchangeRate[vm.salary] && vm.exchangeRate[vm.salary][vm.salary_status];
    };

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
    vm.handleSearch = function () {
      this.products.length = 0;
      $scope.handleShowWaiting();
      setTimeout(function () {
        prepareCondition(false);
        handleSearch();
      }, 500);
    };
    vm.handleSortChanged = function (sort_column) {
      vm.condition = $scope.handleSortChanged(vm.condition, sort_column);
      handleSearch();
    };
    vm.sort = function (index) {
      vm.condition.sort_option = index;
      vm.handleSearch();
    };
    vm.loadMore = function () {
      vm.condition.page += 1;
      handleSearch();
    };

    vm.addToCart = function (productId, municipalityId, quantity) {
      var _quantity = quantity || 1;
      $scope.handleShowWaiting();
      CartsApi.addOrUpdateCart({ productId: productId, municipalityId: municipalityId, quantity: _quantity, isFromTop: true })
        .success(function (res) {
          $scope.handleCloseWaiting();
          if (res) {
            $state.go('company.ecommerces.cart');
          }
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
          return false;
        });
    };

    function isBackFromProductDetail() {
      return $state.previous && $state.previous.state && $state.previous.state.name === 'company.ecommerces.product-detail';
    }
  }
}());
