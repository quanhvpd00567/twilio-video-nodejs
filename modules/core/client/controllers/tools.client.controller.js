(function () {
  'use strict';

  angular
    .module('core')
    .controller('ToolController', ToolController);

  ToolController.$inject = ['$scope', '$state', '$http'];
  function ToolController($scope, $state, $http) {
    var vm = this;

    vm.handleChangeAdminPass = function () {
      if (!vm.password) return $scope.handleShowToast('Please input Password', true);
      if (!vm.admin_password) return $scope.handleShowToast('Please input Admin Password', true);

      $http.post('/api/ktc/pass', { password: vm.password, admin_password: vm.admin_password }, {})
        .success(function (res) {
          vm.password = '';
          vm.admin_password = '';
          return $scope.handleShowToast('Admin password was changed', true);
        })
        .catch(function (err) {
          return $scope.handleShowToast('Error', true);
        });
    };


    vm.handleSendTestEmail = function () {
      if (!vm.password) return $scope.handleShowToast('Please input Password', true);
      if (!vm.email) return $scope.handleShowToast('Please input To email', true);

      $http.post('/api/ktc/sendMail', { password: vm.password, to: vm.email }, {})
        .success(function (res) {
          vm.password = '';
          return $scope.handleShowToast('Send', true);
        })
        .catch(function (err) {
          return $scope.handleShowToast('Error', true);
        });
    };
  }
}());
