(function () {
  'use strict';

  angular
    .module('companies.admin')
    .controller('DepartmentFormCompanyController', DepartmentFormCompanyController);

  DepartmentFormCompanyController.$inject = ['$scope', '$state', 'departmentResolve', '$stateParams', '$filter', 'SubsidiaryApi'];

  function DepartmentFormCompanyController($scope, $state, department, $stateParams, $filter, SubsidiaryApi) {
    var vm = this;
    vm.department = department;
    // vm.company.password = '';
    vm.master = $scope.masterdata;
    vm.listCompanySearch = [];
    vm.start = 0;
    onCreate();

    function onCreate() {
      getAllByCompany();
    }

    // Handle update company
    vm.createOrUpdate = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.departmentForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('departments.form.controller.message.confirm_save'),
        btnClose: $filter('translate')('common.button.existModal'),
        btnOk: $filter('translate')('common.button.ok')
      }, function () {
        $scope.handleShowWaiting();

        vm.department.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          vm.isSaveClick = false;
          $scope.handleCloseWaiting();
          var message = $filter('translate')('departments.form.controller.message.save_success');
          $scope.$broadcast('show-errors-reset');
          $scope.handleShowToast(message);
          $state.go('company.departments.list');
        }

        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('companies.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
    };


    function getAllByCompany() {
      SubsidiaryApi.getAllByCompany({})
        .success(function (res) {
          vm.subsidiaries = res;
          if (!vm.department._id && vm.subsidiaries) {
            vm.department.subsidiary = vm.subsidiaries[0]._id;
          } else {
            vm.department.subsidiary = vm.department.subsidiary._id;
          }
          $scope.handleCloseWaiting();
        }).error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.message || $filter('translate')('companies.form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        });
    }
  }
}());
