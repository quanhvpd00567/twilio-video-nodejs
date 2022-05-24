(function () {
  'use strict';

  angular
    .module('employees.admin')
    .controller('EmployeeFormController', EmployeeFormController);

  EmployeeFormController.$inject = ['$scope', '$state', 'employee', '$stateParams', 'EmployeeApi', '$filter', 'DepartmentApi'];

  function EmployeeFormController($scope, $state, employee, $stateParams, EmployeeApi, $filter, DepartmentApi) {
    var vm = this;
    vm.employee = employee;
    vm.master = $scope.masterdata;
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

      if (vm.employee && vm.employee._id && $scope.isCompany(vm.employee.roles)) {
        EmployeeApi.isOnlyOneCompanyAccount(vm.employee._id)
          .success(function (res) {
            vm.employee.isOnlyOneCompanyAccount = res;
          });
      }

      getSubsidiaries();

      vm.employee.password = '';
      if (!vm.employee._id) {
        vm.employee.role = vm.roles[vm.roles.length - 1].id;
      } else {
        if (vm.employee.roles.length > 1) {
          vm.employee.roles.filter(function (item) {
            if (item === 'company') {
              vm.employee.role = item;
            }
            return item;
          });
        } else {
          vm.employee.role = vm.employee.roles[0];
        }
      }
    }

    function getSubsidiaries() {
      EmployeeApi.subsidiaries({ is_paging: false, companyId: vm.companyId })
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.subsidiaries = res;
          vm.subsidiaries = vm.subsidiaries.map(function (item) {
            item.name = $scope.getFullCompanyName(item.kind, item.name);
            return item;
          });

          if (!vm.employee._id && vm.subsidiaries.length > 0) {
            vm.employee.subsidiary = vm.subsidiaries[0]._id;
          } else {
            if (vm.employee.subsidiary !== undefined) {
              vm.employee.subsidiary = vm.employee.subsidiary._id;
            }
          }

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
      DepartmentApi.getAllByCompany({ companyId: vm.companyId, subsidiary: vm.employee.subsidiary })
        .success(function (res) {
          vm.departments = res;
          if (!vm.employee._id && vm.departments.length > 0) {
            // vm.employee.e_department = vm.departments[0]._id;
          } else {
            if (vm.employee.e_department) {
              vm.employee.e_department = vm.employee.e_department._id;
            }
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
        vm.employee.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          if (vm.companyId) {
            $state.go('admin.requests_registration.list');
          } else {
            $state.go('company.employees.list');
          }

          var message = $filter('translate')('employees.form.controller.message.save_success');
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('employees.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
    };

    vm.onChange = function () {
      getListDepartments();
    };
  }
}());
