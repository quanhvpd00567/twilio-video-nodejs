(function () {
  'use strict';

  angular
    .module('qas.admin')
    .controller('QAFormController', QAFormController);

  QAFormController.$inject = ['$scope', '$state', 'qaResolve', '$filter'];

  function QAFormController($scope, $state, qa, $filter) {
    var vm = this;
    vm.qa = qa;
    vm.update = update;

    onCreate();
    function onCreate() {
    }

    function update(isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.qaForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('qa.form.controller.message.confirm_save')
      }, function () {
        $scope.handleShowWaiting();

        vm.qa.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          $state.go('admin.qas.detail', { qaId: res && res._id });
          var message = $filter('translate')('qa.form.controller.message.save_success');
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('qa.form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        }
      });
    }
  }
}());
