(function () {
  'use strict';

  angular
    .module('subsidiaries.admin')
    .controller('SubsidiaryFormController', SubsidiaryFormController);

  SubsidiaryFormController.$inject = ['$scope', '$state', 'subsidiary', 'ngDialog', 'CompanyApi', '$filter'];

  function SubsidiaryFormController($scope, $state, subsidiary, ngDialog, CompanyApi, $filter) {
    var vm = this;
    vm.subsidiary = subsidiary;
    vm.master = $scope.masterdata;
    vm.start = [];
    vm.listCompanySearch = [];
    vm.roles = vm.master.company_roles;
    vm.companyId = null;
    onCreate();

    function onCreate() {
      vm.companyId = $state.params.companyId;
      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && !vm.companyId) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }

      if (!vm.subsidiary._id) {
        vm.subsidiary.kind = 1;
      }
    }

    // Handle update company
    vm.createOrUpdate = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.subsidiaryForm');

        return false;
      }

      if (vm.companyId) {
        vm.subsidiary.companyId = vm.companyId;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('subsidiaries.form.controller.message.confirm_save')
      }, function () {
        $scope.handleShowWaiting();
        vm.subsidiary.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          // $state.go('admin.notices.detail', { noticeId: res && res._id });
          if (vm.companyId) {
            $state.go('admin.requests_registration.list');
          } else {
            $state.go('company.subsidiaries.list');
          }

          var message = $filter('translate')('subsidiaries.form.controller.message.save_success');
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('subsidiaries.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
    };

    vm.onGetNumberCompany = function () {
      if (vm.subsidiary.name === '' || vm.subsidiary.name === undefined) {
        return;
      }
      $scope.handleShowWaiting();
      CompanyApi.getNumber(vm.subsidiary.name)
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

    function showModalListNmber(data) {
      vm.listCompanySearch = data.docs;
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
              vm.subsidiary.number = item.corporateNumber;
              // vm.subsidiary.name = item.name;
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
