(function () {
  'use strict';

  angular
    .module('munic_members.municipality')
    .controller('MunicMembersFormController', MunicMembersFormController);

  MunicMembersFormController.$inject = ['$scope', '$state', 'member', '$stateParams', 'EmployeeApi', '$filter', 'RequestRegistrationApi', 'RequestsApplicationApi', 'MunicMemberApi'];

  function MunicMembersFormController($scope, $state, member, $stateParams, EmployeeApi, $filter, RequestRegistrationApi, RequestsApplicationApi, MunicMemberApi) {
    var vm = this;
    vm.municMember = member;
    vm.master = $scope.masterdata;
    vm.roles = vm.master.munic_roles;
    vm.auth = $scope.Authentication.user;
    vm.featureAuthor = null;
    vm.municipalityId = null;
    vm.isCreateRequest = !vm.municMember._id;
    vm.requestItemId = $stateParams.requestItemId;
    vm.isNeedAuthorize = $stateParams.isNeedAuthorize;

    onCreate();

    function onCreate() {
      if (member.is_notfound) {
        $state.go('municipality.munic_members.list');
      }

      if (vm.requestItemId) {
        $scope.handleShowWaiting();
        RequestsApplicationApi.get(vm.requestItemId)
          .success(function (res) {
            $scope.handleCloseWaiting();
            Object.assign(vm.municMember, res.data);
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
      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && !vm.municipalityId) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }

      if (vm.municMember && vm.municMember._id && $scope.isMunicAdmin(vm.municMember.roles)) {
        MunicMemberApi.isOnlyOneMunicAdmin(vm.municMember._id)
          .success(function (res) {
            vm.municMember.isOnlyOneMunicAdmin = res;
          });
      }

      if (vm.municipalityId) {
        RequestRegistrationApi.checkPermissionRequest({ municipalityId: vm.municipalityId })
          .success(function (res) {
            vm.featureAuthor = res;
            var features_authorized = vm.featureAuthor.features_authorized;
            _.forEach(features_authorized, function (item) {
              if (item.feature === 'update_munic_member' || item.feature === 'delete_munic_member' || item.feature === 'create_munic_member') {
                if (item.feature === 'update_munic_member') {
                  vm.isEdit = true;
                }

                if (item.feature === 'delete_munic_member') {
                  vm.isDelete = true;
                }

                return true;
              } else {
                return false;
              }
            });

          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            var message = error && error.data && error.data.message || $filter('translate')('munic_members.form.controller.message.save_failed');

            $scope.handleShowToast(message, true);
          });
      }

      vm.municMember.password = '';
      if (!vm.municMember._id) {
        vm.municMember.role = vm.roles[vm.roles.length - 1].id;
      } else {
        vm.municMember.role = vm.municMember.roles[0];
      }
    }

    // Handle update company
    vm.createOrUpdate = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.municMemberForm');

        return false;
      }

      if (vm.municipalityId) {
        vm.municMember.municipalityId = vm.municipalityId;
      }

      var messageConfirm = $filter('translate')('munic_members.form.controller.message.confirm_save');
      if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
        messageConfirm = $filter('translate')('request_item.server.message.confirm_register');
      }

      $scope.handleShowConfirm({
        message: messageConfirm
      }, function () {
        $scope.handleShowWaiting();

        if (vm.requestItemId) {
          vm.municMember.requestItemId = vm.requestItemId;
          if (!vm.isCreateRequest) {
            MunicMemberApi.update(vm.municMember._id, vm.municMember)
              .success(successCallback)
              .error(errorCallback);
          } else {
            MunicMemberApi.create(vm.municMember)
              .success(successCallback)
              .error(errorCallback);
          }
        } else {
          vm.municMember.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);
        }

        function successCallback(res) {
          $scope.handleCloseWaiting();
          if (vm.requestItemId) {
            $state.go('municipality.requests_application.list');
          } else if (vm.municipalityId) {
            if (res.perrmision_error) {
              $scope.handleErrorFeatureAuthorization();
              return;
            } else {
              $state.go('admin.requests_registration.list');
            }
          } else {
            $state.go('municipality.munic_members.list');
          }

          var message = $filter('translate')('munic_members.form.controller.message.save_success');
          if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
            message = $filter('translate')('request_item.server.message.save_success');
          }
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('munic_members.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
    };
  }
}());
