(function () {
  'use strict';

  angular
    .module('events.company')
    .controller('EventDetailController', EventDetailController);

  EventDetailController.$inject = ['$scope', '$state', '$filter', 'EventsApi', '$stateParams', 'ngDialog', 'ComProjectApi'];

  function EventDetailController($scope, $state, $filter, EventsApi, $stateParams, ngDialog, ComProjectApi) {
    var vm = this;
    vm.event = {};
    vm.eventId = $stateParams.eventId;

    onCreate();

    function onCreate() {
      if (!vm.eventId) {
        $state.go('company.events.list');
      }

      vm.companyId = $state.params.companyId;
      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && !vm.companyId) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }

      $scope.handleShowWaiting();
      EventsApi.detail(vm.eventId, vm.companyId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.event = res;
          if (!vm.event) {
            $state.go('company.events.list');
          }

          if (vm.event.method === $scope.masterdata.PAYMENT_METHOD.BANK_TRANSFER) {
            // parse data for bank transfer note
            vm.bankTransferPaymentMethodNote = $filter('translate')('event.project_apply.form.payment_method.bank_transfer.note');
            vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{bank_name}', res.municipality && res.municipality.bank_name);
            vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{branch_name}', res.municipality && res.municipality.branch_name);
            var bankTypeValue = $scope.showMasterValue($scope.masterdata.bank_types, res.municipality && res.municipality.bank_type);
            vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{bank_type}', bankTypeValue);
            vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{bank_number}', res.municipality && res.municipality.bank_number);
            vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{bank_owner}', res.municipality && res.municipality.bank_owner);
            vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{bank_owner_kana}', res.municipality && res.municipality.bank_owner_kana);
          }
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });

      prepareCondition();
      handleSearch(true);
    }

    function prepareCondition() {
      vm.condition = $scope.prepareCondition('event_comprojects', true);
      vm.condition.sort_column = 'created';
      vm.condition.sort_direction = '-';
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      EventsApi.pagingComprojects(vm.condition, vm.eventId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.docs = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('event_comprojects', vm.condition);
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
    vm.handleConditionChanged = function (changed, key, old) {
      if (!changed && (key === 'end_date')) {
        if (old) {
          var valNew = moment(vm.condition[key]);
          var valOld = moment(old);
          if (valNew.format('YYYYMMDD') !== valOld.format('YYYYMMDD')) {
            vm.condition[key] = valNew.hour(23).minute(59).second(59).toDate();
          }
        } else {
          vm.condition[key] = moment(vm.condition[key]).hour(23).minute(59).second(59).toDate();
        }
      }
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

    vm.handlePageChanged = function () {
      handleSearch();
    };

    vm.concatProjectNames = function (projectNames) {
      var string = '';
      _.forEach(projectNames, function (name, index) {
        string += name;
        if (index !== (projectNames.length - 1)) {
          string += '・';
        }
      });

      return string;
    };
  }
}());
