(function () {
  'use strict';

  angular
    .module('notices.admin')
    .controller('NoticeFormController', NoticeFormController);

  NoticeFormController.$inject = ['$scope', '$state', 'noticeResolve', '$filter', 'MunicipalitiesApi', 'CompanyApi'];

  function NoticeFormController($scope, $state, notice, $filter, MunicipalitiesApi, CompanyApi) {
    var vm = this;
    vm.dateOptionsStartTime = { showWeeks: false, minDate: new Date(), maxDate: null };
    vm.dateOptionsEndTime = { showWeeks: false, minDate: new Date(), maxDate: null };
    vm.notice = notice;
    vm.update = update;
    vm.NOTICE_TARGET = {
      ALL: 1,
      CONDITION: 2
    };
    vm.isClone = false;

    vm.municipalities = [];
    vm.companies = [];
    onCreate();

    function onCreate() {
      prepareDataClone();
      initMunicipalities();
      initCompanies();

      if (!vm.notice._id) {
        vm.notice.target = vm.NOTICE_TARGET.ALL;
      } else {
        vm.dateOptionsEndTime.minDate = new Date(vm.notice.start_time);
        vm.notice.start_time = new Date(vm.notice.start_time);
        vm.dateOptionsStartTime.maxDate = new Date(vm.notice.end_time);
        vm.notice.end_time = new Date(vm.notice.end_time);
      }

      if (vm.notice.send && !vm.isClone) {
        $state.go('admin.notices.list');
      }
    }

    function initMunicipalities() {
      MunicipalitiesApi.getAll()
        .then(function (res) {
          vm.municipalities = res && res.data;
          refreshSelectPicker();
        });
    }

    function initCompanies() {
      CompanyApi.getAll()
        .then(function (res) {
          vm.companies = res && res.data;
          refreshSelectPicker();
        });
    }

    function update(isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.noticeForm');
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('notice.form.controller.message.confirm_save')
      }, function () {
        $scope.handleShowWaiting();

        if (vm.notice.target === vm.NOTICE_TARGET.ALL) {
          delete vm.notice.municipalities;
          delete vm.notice.companies;
        }
        vm.notice.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          $state.go('admin.notices.detail', { noticeId: res && res._id });
          var message = $filter('translate')('notice.form.controller.message.save_success');
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('notice.form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        }
      });
    }

    vm.onChangeStartTime = function () {
      vm.dateOptionsEndTime.minDate = new Date(vm.notice.start_time);
    };

    vm.onChangeEndTime = function () {
      vm.dateOptionsStartTime.maxDate = new Date(vm.notice.end_time);
    };

    vm.onChangeTarget = function () {
      if (vm.notice.target === vm.NOTICE_TARGET.CONDITION) {
        refreshSelectPicker();
      }
    };

    vm.isRequiredCompaniesOrMunicipalities = function () {
      return (!vm.notice.companies || vm.notice.companies.length === 0)
        && (!vm.notice.municipalities || vm.notice.municipalities.length === 0);
    };

    function prepareDataClone() {
      if ($state.params.cloneNoticeId) {
        vm.isClone = true;
        vm.notice.is_clone = true;
        delete vm.notice._id;
        delete vm.notice.start_time;
        delete vm.notice.created;
        delete vm.notice.end_time;
      }
    }

    function refreshSelectPicker() {
      setTimeout(function () {
        $('.selectpicker').selectpicker();
      });
    }
  }
}());
