(function () {
  'use strict';

  angular
    .module('employees.admin')
    .controller('EmployeeListController', EmployeeListController);

  EmployeeListController.$inject = ['$scope', '$state', '$filter', '$location', 'EmployeeApi', 'EmployeeService', 'RequestRegistrationApi', 'ngDialog', '$window'];

  function EmployeeListController($scope, $state, $filter, $location, EmployeeApi, EmployeeService, RequestRegistrationApi, ngDialog, $window) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.roles = vm.master.company_roles;
    vm.listIds = [];
    vm.listIdsAll = [];
    vm.ids = [];
    vm.isDisable = true;
    vm.isEdit = false;
    vm.isDelete = false;
    vm.isDownloadCSV = false;
    vm.isExport = false;
    vm.isAssignRequest = false;
    onCreate();

    function onCreate() {
      vm.companyId = $state.params.companyId;
      vm.key = $state.params.key;
      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && !vm.companyId) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }
      if (vm.companyId) {
        vm.isAssignRequest = true;
        RequestRegistrationApi.checkPermissionRequest({ companyId: vm.companyId })
          .success(function (res) {
            if (res.perrmision_error) {
              $scope.handleErrorFeatureAuthorization();
            }

            vm.featureAuthor = res;
            var features_authorized = vm.featureAuthor.features_authorized;
            features_authorized.forEach(function (item) {
              if (item.feature === 'update_employee' && vm.key === 'update_employee') {
                vm.isEdit = true;
              }
              if (item.feature === 'delete_employee' && vm.key === 'delete_employee') {
                vm.isDelete = true;
              }
              if (item.feature === 'download_employee' && vm.key === 'download_employee') {
                vm.isDownloadCSV = true;
                vm.isExport = true;
              }
            });
          });
      } else {
        vm.isEdit = true;
        vm.isDelete = true;
        vm.isDownloadCSV = true;
        vm.isExport = true;
      }
      getSubsidiaries();
      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('employees', clear);
      vm.condition.companyId = vm.companyId;
      // vm.condition.sort_column = 'created';
      // vm.condition.sort_direction = '';
      vm.dateOptionsCreatedMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsCreatedMax = { showWeeks: false, minDate: null };
    }

    function getSubsidiaries() {
      EmployeeApi.subsidiaries({ is_paging: false, companyId: vm.companyId })
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.subsidiaries = res;
          $scope.handleCloseWaiting();
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      vm.listIds = [];
      vm.ids = [];
      vm.listIdsAll = [];

      EmployeeApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.employees = res.docs;
          vm.employees.map(function (item) {
            item.check = true;
            return item;
          });
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('employees', vm.condition);
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
      $scope.handleShowConfirm({
        message: $filter('translate')('employees.list.controller.message.confirm_delete')
      }, function () {
        var emplyee = new EmployeeService({ _id: _id });
        emplyee.$remove({ companyId: vm.companyId }, function () {
          handleSearch();
          var message = $filter('translate')('employees.list.controller.message.delete_success');
          $scope.handleShowToast(message);
        }, function (error) {
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
      });
    };

    vm.onSelect = function (_id) {
      vm.listIdsAll = [];
      if (vm.listIds.includes(_id)) {
        // remove item selected
        var index = vm.listIds.indexOf(_id);
        if (index > -1) {
          vm.listIds.splice(index, 1);
        }
      } else {
        // set item to list selected
        vm.listIds.push(_id);
      }

      vm.ids = vm.listIds.filter(function (item, pos) {
        var employee = vm.employees.find(function (employee) {
          return employee._id === item;
        });
        return vm.listIds.indexOf(item) === pos && employee && !$scope.isCompany(employee.roles);
      });

      vm.isDisable = true;
      if (vm.ids.length > 0) {
        vm.isDisable = false;
      }
    };

    vm.onSelectAll = function () {
      // vm.listIds = [];
      if (vm.listIdsAll.length > 0) {
        // reset list item selected
        vm.listIdsAll = [];
      } else {
        vm.employees.forEach(function (item) {
          // set item to list selected
          vm.listIdsAll.push(item._id);
        });
      }

      vm.listIds = vm.listIdsAll;

      vm.ids = vm.listIdsAll.filter(function (item, pos) {
        var employee = vm.employees.find(function (employee) {
          return employee._id === item;
        });
        return vm.listIdsAll.indexOf(item) === pos && employee && !$scope.isCompany(employee.roles);
      });

      vm.isDisable = true;
      if (vm.ids.length > 0) {
        vm.isDisable = false;
      }
    };

    /**
     * Remove all employee selected
     *
     */
    vm.removeMulti = function () {
      vm.ids = vm.ids.filter(function (item, pos) {
        var employee = vm.employees.find(function (employee) {
          return employee._id === item;
        });
        return vm.ids.indexOf(item) === pos && employee && !$scope.isCompany(employee.roles);
      });
      $scope.handleShowConfirm({
        message: $filter('translate')('employees.list.controller.message.confirm_delete')
      }, function () {
        EmployeeApi.removeMulti(vm.ids).success(function (res) {
          vm.listIds = [];
          vm.listIdsAll = [];
          vm.ids = [];
          handleSearch();

          var message = $filter('translate')('employees.list.controller.message.delete_success');
          $scope.handleShowToast(message);
        }).error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('employees.list.controller.message.delete_faild');
          $scope.handleShowToast(message, true);
        });
      });
    };

    vm.onChangeCreatedMin = function () {
      vm.dateOptionsCreatedMax.minDate = new Date(vm.condition.created_min);
    };

    vm.onChangeCreatedMax = function () {
      vm.dateOptionsCreatedMin.maxDate = new Date(vm.condition.created_max);
    };

    vm.export = function (isTemplate) {
      var message = $filter('translate')('employees.list.controller.message.confirm_export_csv');
      var messageError = $filter('translate')('common.excel.export.failed');

      vm.condition.is_template = isTemplate;
      if (isTemplate) {
        message = $filter('translate')('employees.list.controller.message.confirm_export');
        messageError = $filter('translate')('employees.list.controller.message.export_faild');
      }

      $scope.handleShowConfirm({
        message: message
      }, function () {
        EmployeeApi.export(vm.condition).success(function (res) {
          $scope.handleCloseWaiting();
          window.open('/' + res.url, '_newtab');
        }).error(function (error) {
          $scope.handleCloseWaiting();

          var message = error && error.data && error.data.message || messageError;
          $scope.handleShowToast(message, true);
        });
      });
    };

    vm.onShowUrl = function () {
      ngDialog.openConfirm({
        templateUrl: '/modules/employees/client/views/modal-info.client.view.html',
        scope: $scope,
        showClose: false,
        closeByDocument: false,
        width: 1000,
        controller: ['$scope', function ($scope) {
          var url = $state.href('employees-guest.create', {}, { absolute: true });
          onCreate();

          function onCreate() {
            vm.isShowQrcode = false;
            vm.isShowSelectSub = !vm.isShowQrcode;
            getSubsidiaries();
          }

          function getSubsidiaries() {
            EmployeeApi.subsidiaries({ is_paging: false, companyId: vm.companyId })
              .success(function (res) {
                $scope.handleCloseWaiting();
                vm.e_subsidiaries = res;
                if (!vm.e_subsidiary) {
                  vm.e_subsidiary = vm.e_subsidiaries[0]._id;
                }
                $scope.handleCloseWaiting();
              })
              .error(function (error) {
                $scope.handleCloseWaiting();
                var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
                $scope.handleShowToast(message, true);
              });
          }

          vm.selectSubCompany = function () {
            vm.isShowQrcode = true;
            vm.isShowSelectSub = !vm.isShowQrcode;
            generateQrCode();
          };

          function generateQrCode() {
            $scope.handleShowWaiting();
            EmployeeApi.qrCode({ subsidiary: vm.e_subsidiary, url: url }).success(function (res) {
              vm.info = res;
              $scope.handleCloseWaiting();
            });
          }

          vm.copyToClipboard = function (val) {
            var $temp_input = $('<input>');
            $('body').append($temp_input);
            $temp_input.val(val).select();
            document.execCommand('copy');
            $temp_input.remove();

            var message = $filter('translate')('common.label.copied');
            $scope.handleShowToast(message);
          };

          vm.downloadQrcode = function () {
            var link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = vm.info.qr;
            link.click();
          };
        }]
      });
    };
  }
}());
