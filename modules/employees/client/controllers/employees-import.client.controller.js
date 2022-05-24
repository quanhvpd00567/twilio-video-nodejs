(function () {
  'use strict';

  angular
    .module('employees.admin')
    .controller('EmployeeImportController', EmployeeImportController);

  EmployeeImportController.$inject = ['$scope', '$state', 'CompanyApi', '$filter', 'FileUploader'];

  function EmployeeImportController($scope, $state, CompanyApi, $filter, FileUploader) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.companyId = $state.params.companyId;

    prepareUploaderExcel();

    vm.startUpload = function () {
      $scope.handleShowWaiting();
      vm.errors = [];
      if (vm.hasFileExcel) {
        vm.uploaderExcel.uploadAll();
      }
    };

    vm.isDisableUploadButton = function () {
      return !vm.hasFileExcel
        && !vm.numberOfSelectedImages;
    };

    function prepareUploaderExcel() {
      if ($scope.isAdminOrSubAdmin && !vm.companyId) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }

      vm.uploaderExcel = new FileUploader({
        url: '/api/employees/import?companyId=' + vm.companyId,
        alias: 'import'
      });

      vm.uploaderExcel.filters.push({
        name: 'import',
        fn: $scope.excelFilter
      });

      vm.uploaderExcel.onAfterAddingFile = function () {
        if (vm.uploaderExcel.queue.length > 1) {
          vm.uploaderExcel.queue.splice(0, 1);
        }
        vm.hasFileExcel = true;
        vm.selectedFileName = vm.uploaderExcel.queue[0] && vm.uploaderExcel.queue[0]._file
          && vm.uploaderExcel.queue[0]._file.name || '';
      };
      vm.uploaderExcel.onWhenAddingFileFailed = function () {
        $('#file-selection').val(null);
        vm.hasFileExcel = false;
        vm.selectedFileName = '';
        vm.uploaderExcel.clearQueue();
      };

      vm.uploaderExcel.onSuccessItem = function (fileItem, response) {
        if (response.status && response.result) {
          $scope.handleShowToast($filter('translate')('employees.import.controller.message.import_success'));
          $scope.handleCloseWaiting();
        } else {
          vm.errors = response.errors || [];
          $scope.handleShowToast($filter('translate')('employees.import.controller.message.import_failed'), true);
          $scope.handleCloseWaiting();
        }

        $('#file-selection').val(null);
        vm.hasFileExcel = false;
        vm.selectedFileName = '';
        vm.uploaderExcel.clearQueue();
      };

      vm.uploaderExcel.onErrorItem = function (fileItem, response, status, headers) {
        $scope.handleCloseWaiting();
        var message = $filter('translate')('employees.import.controller.message.import_failed');
        if (response && response.message) {
          message = response.message;
        } else if (response.data && response.data.message) {
          message = response.data.message;
        }
        vm.errors = [message];
        $scope.handleShowToast(message, true);

        $('#file-selection').val(null);
        vm.hasFileExcel = false;
        vm.selectedFileName = '';
        vm.uploaderExcel.clearQueue();
      };
    }
  }
}());
