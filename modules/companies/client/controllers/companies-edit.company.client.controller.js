(function () {
  'use strict';

  angular
    .module('companies.admin')
    .controller('CompanyEditCompanyController', CompanyEditCompanyController);

  CompanyEditCompanyController.$inject = ['$scope', '$state', 'ngDialog', 'CompanyApi', '$filter', 'CompanyService'];

  function CompanyEditCompanyController($scope, $state, ngDialog, CompanyApi, $filter, CompanyService) {
    var vm = this;
    // vm.company = company;
    vm.master = $scope.masterdata;
    vm.start = 0;
    vm.listCompanySearch = [];

    onCreate();

    function onCreate() {
      var companyId = $state.params.companyId;
      CompanyApi.info(companyId).success(function (res) {
        vm.company = res;
        $scope.handleCloseWaiting();
      }).error(function (error) {
        $scope.handleCloseWaiting();
        var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
        $scope.handleShowToast(message, true);
      });
    }

    // Handle update company
    vm.update = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.companyForm');
        return false;
      }

      var company = new CompanyService({ _id: vm.company._id, name: vm.company.name, number: vm.company.number, isAdminUpdatedByFeatureAuthorization: true });
      $scope.handleShowConfirm({
        message: $filter('translate')('companies.form.edit.controller.message.confirm_save')
      }, function () {
        $scope.handleShowWaiting();

        // vm.company = new
        company.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          $state.go('company.companies.edit');

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
