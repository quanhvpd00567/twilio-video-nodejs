(function () {
  'use strict';

  angular
    .module('companies.admin')
    .controller('CompanyEditController', CompanyEditController);

  CompanyEditController.$inject = ['$scope', '$state', 'companyResolve', 'ngDialog', 'CompanyApi', '$filter'];

  function CompanyEditController($scope, $state, company, ngDialog, CompanyApi, $filter) {
    var vm = this;
    vm.company = company;
    vm.master = $scope.masterdata;
    vm.start = 0;
    vm.listCompanySearch = [];
    vm.isCreate = false;
    onCreate();

    function onCreate() {
      if (!vm.company._id) {
        vm.company.kind = 1;
        vm.isCreate = true;
      } else {
        vm.accept = true;
      }
    }

    // Handle update company
    vm.updateOrCreate = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.companyForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('companies.form.edit.controller.message.confirm_save')
      }, function () {
        $scope.handleShowWaiting();

        vm.company.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          $state.go('admin.companies.list');

          var message = $filter('translate')('companies.form.edit.controller.message.save_success');
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('companies.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
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
