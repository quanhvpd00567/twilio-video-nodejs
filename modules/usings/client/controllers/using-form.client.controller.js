(function () {
  'use strict';

  angular
    .module('usings.municipality')
    .controller('UsingFormController', UsingFormController);

  UsingFormController.$inject = ['$scope', '$stateParams', '$state', 'usingResolve', '$filter', 'RequestsApplicationApi', 'UsingsApi'];

  function UsingFormController($scope, $stateParams, $state, using, $filter, RequestsApplicationApi, UsingsApi) {
    var vm = this;
    vm.using = using;
    vm.update = update;
    vm.dateOptionsStartTime = { showWeeks: false, minDate: null, maxDate: null };
    vm.dateOptionsEndTime = { showWeeks: false, minDate: new Date(), maxDate: null };
    vm.auth = $scope.Authentication.user;
    vm.isCreateRequest = !vm.using._id;
    vm.requestItemId = $stateParams.requestItemId;

    onCreate();

    function onCreate() {
      if (vm.requestItemId) {
        $scope.handleShowWaiting();
        RequestsApplicationApi.get(vm.requestItemId)
          .success(function (res) {
            $scope.handleCloseWaiting();
            Object.assign(vm.using, res.data);
            init();
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            $scope.handleShowToast($scope.parseErrorMessage(error), true);
          });
      } else {
        init();
      }
    }

    function init() {
      vm.municipalityId = $state.params.municipalityId;
      vm.isNeedAuthorize = $state.params.isNeedAuthorize;
      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && !vm.municipalityId) {
        $scope.handleErrorFeatureAuthorization();
      }

      if ($state.params.usingIdCloned) {
        delete vm.using._id;
        delete vm.using.code;
        delete vm.using.start;
        delete vm.using.end;
        delete vm.using.created;
      }

      if (vm.using._id) {
        if (vm.using.start) {
          vm.dateOptionsEndTime.minDate = new Date(vm.using.start);
          vm.using.start = new Date(vm.using.start);
        }

        if (vm.using.end) {
          vm.dateOptionsStartTime.maxDate = new Date(vm.using.end);
          vm.using.end = new Date(vm.using.end);
        }
      }
    }

    function update(isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.usingForm');
        return false;
      }

      var messageConfirm = $filter('translate')('using.form.controller.message.confirm_save');
      if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
        messageConfirm = $filter('translate')('request_item.server.message.confirm_register');
      }

      $scope.handleShowConfirm({
        message: messageConfirm
      }, function () {
        $scope.handleShowWaiting();
        if (vm.municipalityId) {
          vm.using.municipalityId = vm.municipalityId;
        }

        if (vm.requestItemId) {
          vm.using.requestItemId = vm.requestItemId;
          if (!vm.isCreateRequest) {
            UsingsApi.update(vm.using._id, vm.using)
              .success(successCallback)
              .error(errorCallback);
          } else {
            UsingsApi.create(vm.using)
              .success(successCallback)
              .error(errorCallback);
          }
        } else {
          vm.using.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);
        }

        function successCallback(res) {
          $scope.handleCloseWaiting();
          if (vm.requestItemId) {
            $state.go('municipality.requests_application.list');
          } else if (vm.municipalityId) {
            $state.go('admin.requests_registration.list');
          } else {
            $state.go('municipality.usings.detail', { usingId: res && res._id });
          }
          var message = $filter('translate')('using.form.controller.message.save_success');
          if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
            message = $filter('translate')('request_item.server.message.save_success');
          }
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('using.form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        }
      });
    }

    vm.onChangeStartTime = function () {
      vm.dateOptionsEndTime.minDate = new Date(vm.using.start) >= new Date() ? new Date(vm.using.start) : new Date();
    };

    vm.onChangeEndTime = function () {
      vm.dateOptionsStartTime.maxDate = new Date(vm.using.end);
    };
  }
}());
