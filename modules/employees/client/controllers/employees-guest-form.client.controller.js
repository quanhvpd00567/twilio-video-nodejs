(function () {
  'use strict';

  angular
    .module('employees.admin')
    .controller('EmployeeGuestFormController', EmployeeGuestFormController);

  EmployeeGuestFormController.$inject = ['$scope', '$state', 'employee', '$stateParams', 'EmployeeApi', '$filter', 'DepartmentApi'];

  function EmployeeGuestFormController($scope, $state, employee, $stateParams, EmployeeApi, $filter, DepartmentApi) {
    var vm = this;
    vm.employee = employee;
    vm.master = $scope.masterdata;
    vm.roles = vm.master.company_roles;

    vm.info = $state.params.info;
    vm.isDisableButtonSave = false;

    onCreate();

    function onCreate() {
      getInfoCompany();

    }

    function getInfoCompany() {
      $scope.handleShowWaiting();
      EmployeeApi.getInfoCompany(vm.info)
        .success(function (res) {
          $scope.handleCloseWaiting();

          vm.company = res.company;
          vm.subsidiary = res.subsidiary;
          getSubsidiaries();
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('employees.guest.form.url.error.invalid');
          vm.isDisableButtonSave = true;
          $scope.handleShowToast(message, true);
        });
    }

    function getSubsidiaries() {
      EmployeeApi.subsidiaries({ is_paging: false, companyId: vm.company._id })
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.subsidiaries = res;
          vm.subsidiaries = vm.subsidiaries.map(function (item) {
            item.name = $scope.getFullCompanyName(item.kind, item.name);
            return item;
          });

          vm.subsidiaries = vm.subsidiaries.filter(function (item) {
            return item._id === vm.subsidiary._id;
          });
          vm.employee.subsidiary = vm.subsidiary._id;
          getListDepartments();

          $scope.handleCloseWaiting();
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    function getListDepartments() {
      DepartmentApi.getAllByCompany({ companyId: vm.company._id, subsidiary: vm.employee.subsidiary })
        .success(function (res) {
          vm.departments = res;
          if (!vm.employee._id && vm.departments.length > 0) {
            // vm.employee.e_department = vm.departments[0]._id;
          } else {
            vm.employee.e_department = vm.employee.e_department._id;
          }
        });
    }

    // Handle update company
    vm.createOrUpdate = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;

        if (vm.employee.subsidiary === '' || vm.employee.subsidiary === undefined) {
          $scope.$broadcast('show-errors-check-validity', 'vm.employeeForm');
          vm.employeeForm.subsidiary.$setValidity('sub_required', false);
        } else {
          vm.employeeForm.subsidiary.$setValidity('sub_required', true);
        }

        $scope.$broadcast('show-errors-check-validity', 'vm.employeeForm');

        return false;
      }

      if (vm.companyId) {
        vm.employee.companyId = vm.companyId;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('employees.form.controller.message.confirm_save')
      }, function () {
        $scope.handleShowWaiting();

        EmployeeApi.guestCreate(vm.employee)
          .success(successCallback)
          .error(errorCallback);
        // vm.employee.createOrUpdate()
        //   .then(successCallback)
        //   .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          var message = $filter('translate')('employees.form.controller.message.save_success');
          $scope.handleShowToast(message);

          setTimeout(function () {
            window.location.href = '/authentication/signin';
          }, 500);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.message || $filter('translate')('employees.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
    };
  }
}());
