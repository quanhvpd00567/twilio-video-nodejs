(function () {
  'use strict';

  angular
    .module('settings_company.company')
    .controller('SettingsCompanyFormController', SettingsCompanyFormController);

  SettingsCompanyFormController.$inject = ['$scope', '$state', 'ngDialog', 'CompanyApi', '$filter', 'CompanyService'];

  function SettingsCompanyFormController($scope, $state, ngDialog, CompanyApi, $filter, CompanyService) {
    var vm = this;
    vm.company = {};

    onCreate();

    function onCreate() {
      $scope.handleShowWaiting();
      CompanyApi.info().success(function (res) {
        vm.company = res;
        if (vm.company && !vm.company.ranking_to_show) {
          vm.company.ranking_to_show = $scope.masterdata.company_setting_rankings[1].id;
        }
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
        $scope.$broadcast('show-errors-check-validity', 'vm.companyFormRanking');
        return false;
      }

      var company = new CompanyService({ _id: vm.company._id, ranking_to_show: vm.company.ranking_to_show });
      $scope.handleShowConfirm({
        message: $filter('translate')('settings_company.form.controller.message.confirm_save')
      }, function () {
        $scope.handleShowWaiting();

        // vm.company = new
        company.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          var message = $filter('translate')('settings_company.form.controller.message.save_success');
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('settings_company.form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        }
      });
    };
  }
}());
