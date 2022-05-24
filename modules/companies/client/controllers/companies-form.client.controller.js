(function () {
  'use strict';

  angular
    .module('companies.admin')
    .controller('CompanyFormController', CompanyFormController);

  CompanyFormController.$inject = ['$scope', '$state', 'companyResolve', '$stateParams', 'CompanyApi', '$filter', '$sce', '$window', 'ngDialog'];

  function CompanyFormController($scope, $state, company, $stateParams, CompanyApi, $filter, $sce, $window, ngDialog) {
    var vm = this;
    vm.company = company;
    vm.company.password = '';
    vm.master = $scope.masterdata;
    vm.listCompanySearch = [];
    vm.start = 0;
    onCreate();

    function onCreate() {
      if (!vm.company._id) {
        vm.company.kind = 1;
      } else {
        vm.accept = true;
      }
    }

    // Handle update company
    vm.createOrUpdate = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.companyForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('companies.form.controller.message.confirm_save'),
        btnClose: $filter('translate')('common.button.existModal'),
        btnOk: $filter('translate')('common.button.ok')
      }, function () {
        $scope.handleShowWaiting();

        vm.company.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          vm.isSaveClick = false;
          $scope.handleCloseWaiting();
          var message = $filter('translate')('companies.form.controller.message.save_success');
          $scope.$broadcast('show-errors-reset');
          $scope.handleShowToast(message);
          setTimeout(function () {
            window.location.href = '/authentication/signin';
          }, 500);
        }

        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('companies.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
    };

    vm.openLoginPage = function () {
      window.location.href = '/';
    };

    vm.onGetNumberCompany = function () {
      if (vm.company.name === '' || vm.company.name === undefined) {
        return;
      }
      vm.listCompanySearch = [];
      $scope.handleShowWaiting();
      CompanyApi.getNumber(vm.company.name)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.condition = $scope.prepareCondition('companies_list', true);
          vm.condition.limit = 10;
          showModalListNmber(res);
        }).error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.message || $filter('translate')('companies.form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        });
    };

    function onPaging() {
      vm.condition.total = vm.listCompanySearch.length;
      var page = vm.condition.page;
      var limit = vm.condition.limit;
      vm.start = (page * limit) - limit;
      vm.end = vm.start + vm.condition.limit;
      vm.corporations = vm.listCompanySearch.slice(vm.start, vm.end);
      vm.condition.count = vm.corporations.length;
    }

    function showModalListNmber(res) {
      vm.listCompanySearch = res.docs;
      $scope.conditionFactoryUpdate('companies_list', vm.condition);
      ngDialog
        .openConfirm({
          templateUrl: '/modules/core/client/views/template/modal-list-company.client.view.html',
          scope: $scope,
          width: 1000,
          showClose: false,
          controller: ['$scope', function ($scope) {
            onPaging();

            $scope.onSelectNumber = function (item) {
              vm.company.number = item.corporateNumber;
              // vm.company.name = item.name;
              vm.listCompanySearch = [];
              $scope.confirm();
            };

            vm.handlePageChanged = function () {
              onPaging();
            };
          }]
        })
        .then(
          function (res) {
            delete $scope.dialog;
          },
          function (res) {
            delete $scope.dialog;
          }
        );
    }
  }
}());
