(function () {
  'use strict';

  angular
    .module('projects.municipality')
    .controller('ProjectMunicipalityDetailController', ProjectMunicipalityDetailController);

  ProjectMunicipalityDetailController.$inject = ['$scope', '$stateParams', 'projectResolve', 'RequestsApplicationApi'];

  function ProjectMunicipalityDetailController($scope, $stateParams, project, RequestsApplicationApi) {
    var vm = this;
    vm.project = project;
    vm.requestItemId = $stateParams.requestItemId;
    onCreate();

    function onCreate() {
      if ($scope.isAdminOrSubAdmin) {
        vm.municipalityId = vm.project.municipality;
        vm.key = $stateParams.key;
        vm.isNeedAuthorize = $stateParams.isNeedAuthorize;
      }

      if (vm.requestItemId) {
        $scope.handleShowWaiting();
        RequestsApplicationApi.get(vm.requestItemId)
          .success(function (res) {
            $scope.handleCloseWaiting();
            Object.assign(vm.project, res.data);
            vm.imageUrl = $scope.getImageDefault(vm.project.image);
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            $scope.handleShowToast($scope.parseErrorMessage(error), true);
          });
      } else {
        vm.imageUrl = $scope.getImageDefault(vm.project.image);
      }
    }
  }
}());
