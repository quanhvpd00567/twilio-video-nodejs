(function () {
  'use strict';

  angular
    .module('munic_members.municipality')
    .controller('MunicMembersListController', MunicMembersListController);

  MunicMembersListController.$inject = ['$scope', '$state', '$filter', '$location', 'MunicMemberApi', 'MunicMemberService', 'RequestRegistrationApi'];

  function MunicMembersListController($scope, $state, $filter, $location, MunicMemberApi, MunicMemberService, RequestRegistrationApi) {
    var vm = this;
    vm.master = $scope.masterdata;
    vm.listIds = [];
    vm.listIdsAll = [];

    vm.ids = [];
    vm.municipalityId = null;
    vm.auth = $scope.Authentication.user;

    vm.isAdminMunic = $scope.Authentication.user.roles[0] === 'munic_admin';
    var FEATURE_MUNICIPALITY = $scope.masterdata.FEATURE_MUNICIPALITY;

    vm.isDelete = true;
    vm.isCreate = false;
    vm.isDisable = true;

    onCreate();

    function onCreate() {
      init();
      prepareCondition(false);
      handleSearch();
    }

    function init() {
      vm.municipalityId = $state.params.municipalityId;
      vm.key = $state.params.key;
      vm.isNeedAuthorize = $state.params.isNeedAuthorize;

      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && !vm.municipalityId && !vm.key) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }

      if (vm.municipalityId && vm.key) {
        vm.isCreate = vm.key === FEATURE_MUNICIPALITY.CREATE_MUNIC_MEMBER;
        vm.isEdit = vm.key === FEATURE_MUNICIPALITY.UPDATE_MUNIC_MEMBER;
        vm.isDelete = vm.key === FEATURE_MUNICIPALITY.DELETE_MUNIC_MEMBER;
      } else {
        vm.isEdit = $scope.Authentication.user.roles[0] === 'munic_admin';
        vm.isCreate = true;
      }
    }

    vm.checkItemDelete = function (member) {
      var isDelete = true;
      if (!vm.isDelete) {
        isDelete = false;
      }

      if ($scope.isMunicAdmin(member.roles)) {
        isDelete = false;
      }

      return isDelete;
    };

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('members', clear);
      vm.dateOptionsCreatedMin = { showWeeks: false, maxDate: null };
      vm.dateOptionsCreatedMax = { showWeeks: false, minDate: null };
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }

      vm.listIds = [];
      vm.ids = [];
      vm.listIdsAll = [];

      if (vm.municipalityId) {
        vm.condition.municipalityId = vm.municipalityId;
      }

      MunicMemberApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.members = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('members', vm.condition);
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
      var messageConfirm = $filter('translate')('munic_members.list.controller.message.confirm_delete');
      if (vm.municipalityId && vm.key && vm.isNeedAuthorize === 'true') {
        messageConfirm = $filter('translate')('request_item.server.message.confirm_register');
      }
      $scope.handleShowConfirm({
        message: messageConfirm
      }, function () {
        var emplyee = new MunicMemberService({ _id: _id });
        if (vm.isDelete && vm.municipalityId) {
          emplyee.municipalityId = vm.municipalityId;
        }
        emplyee.$remove(function (res) {
          if (res.perrmision_error) {
            $scope.handleErrorFeatureAuthorization();
            return;
          } else {
            vm.isDisable = true;
            handleSearch();
            var message = $filter('translate')('munic_members.list.controller.message.delete_success');
            if (vm.municipalityId && vm.key && vm.isNeedAuthorize === 'true') {
              message = $filter('translate')('request_item.server.message.save_success');
            }
            $scope.handleShowToast(message);
          }
        })
          .catch(errorCallback);
      });
    };

    function errorCallback(error) {
      $scope.handleCloseWaiting();
      var message = error && error.data && error.data.message || $filter('translate')('munic_members.form.controller.message.save_failed');

      $scope.handleShowToast(message, true);
    }

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

      vm.isDisable = true;
      if (vm.listIds.length > 0) {
        vm.isDisable = false;
      }

      vm.ids = vm.isDisable;
    };

    vm.onSelectAll = function () {
      vm.listIds = [];
      if (vm.listIdsAll.length > 0) {
        // reset list item selected
        vm.listIdsAll = [];
      } else {
        vm.members.forEach(function (item) {
          // set item to list selected
          vm.listIdsAll.push(item._id);
        });
      }

      vm.listIds = vm.listIdsAll;

      vm.isDisable = true;
      if (vm.listIdsAll.length > 0) {
        vm.isDisable = false;
      }

      vm.ids = vm.listIdsAll;
    };

    /**
     * Remove all employee selected
     *
     */
    vm.removeMulti = function () {
      vm.ids = vm.listIdsAll.concat(vm.listIds);

      vm.ids = vm.ids.filter(function (item, pos) {
        var municMember = vm.members.find(function (member) {
          return member._id === item;
        });
        return vm.ids.indexOf(item) === pos && municMember && !$scope.isMunicAdmin(municMember.roles);
      });

      var messageConfirm = $filter('translate')('munic_members.list.controller.message.confirm_delete');
      if (vm.municipalityId && vm.key && vm.isNeedAuthorize === 'true') {
        messageConfirm = $filter('translate')('request_item.server.message.confirm_register');
      }

      $scope.handleShowConfirm({
        message: messageConfirm
      }, function () {
        var data = { ids: vm.ids };
        if (vm.isDelete && vm.municipalityId) {
          data.municipalityId = vm.municipalityId;
        }
        MunicMemberApi.removeMulti(data)
          .success(function (res) {
            if (res.perrmision_error) {
              $scope.handleErrorFeatureAuthorization();
              return;
            } else {
              vm.ids = [];
              vm.listIdsAll = [];
              vm.listIds = [];
              vm.isDisable = true;
              handleSearch();
              var message = $filter('translate')('munic_members.list.controller.message.delete_success');
              if (vm.municipalityId && vm.key && vm.isNeedAuthorize === 'true') {
                message = $filter('translate')('request_item.server.message.save_success');
              }
              $scope.handleShowToast(message);
            }
          }).error(function (error) {
            $scope.handleCloseWaiting();
            var message = error && error.message || $filter('translate')('munic_members.list.controller.message.delete_faild');
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

    vm.getUrlMemberEdit = function (member) {
      var params = { memberId: member._id };
      if (vm.municipalityId) {
        params.municipalityId = vm.municipalityId;
        params.isNeedAuthorize = vm.isNeedAuthorize;
      }

      $state.go('municipality.munic_members.edit', params);
    };
  }
}());
