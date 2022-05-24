(function () {
  'use strict';

  angular
    .module('projects.company')
    .controller('EventProjectApplyController', EventProjectApplyController);

  EventProjectApplyController.$inject = ['$scope', 'ProjectsApi', '$filter', 'EventsHelper', '$state', '$window'];

  function EventProjectApplyController($scope, ProjectsApi, $filter, EventsHelper, $state, $window) {
    var validator = $window.validator;
    var vm = this;
    vm.isReadCondition = false;
    vm.municipalityName = '';
    vm.projects = [];
    vm.projectNamesSelectedString = '';
    vm.methodsOfMunicipality = [];

    vm.applyData = {
      magazine: $scope.masterdata.magazine_types[2].id,
      type: $scope.masterdata.event_type.FLOATING
    };

    vm.numberOfParticipant;
    vm.averageNumberOfStepPerDay;

    // 寄付予定金額
    vm.donationAmountPlanned = 0;
    // ポイント付与予定
    vm.donationPointPlanned = 0;
    var numberOfDaysOfEvent = 0;

    vm.update = update;
    vm.configObject = {};
    onCreate();

    function onCreate() {
      vm.companyId = $state.params.companyId;
      if ($scope.isAdminOrSubAdmin && !vm.companyId) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }
      // Get projectIdsSelected from EventsHelper
      var tmpApplyProjectsData = EventsHelper.getTmpApplyProjectsData();
      vm.municipalityId = tmpApplyProjectsData && tmpApplyProjectsData.municipalityId;
      var projectIdsSelected = tmpApplyProjectsData && tmpApplyProjectsData.projectIdsSelected || [];
      vm.applyData.start = tmpApplyProjectsData && tmpApplyProjectsData.start;
      vm.applyData.end = tmpApplyProjectsData && tmpApplyProjectsData.end;
      if (!vm.municipalityId || !projectIdsSelected || projectIdsSelected.length === 0 || !vm.applyData.start || !vm.applyData.end) {
        $state.go('company.events.project_search', { municipalityId: vm.municipalityId });
        return;
      }

      numberOfDaysOfEvent = $scope.getDaysFrom2date(vm.applyData.end, vm.applyData.start);
      getProjectsSelected(projectIdsSelected);
    }

    function getProjectsSelected(projectIdsSelected) {
      $scope.handleShowWaiting();
      ProjectsApi.getProjectsOfMunicipalityByProjectIds(vm.municipalityId, projectIdsSelected, vm.applyData.start)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.projects = res.projects || [];
          _.forEach(vm.projects, function (project, index) {
            vm.projectNamesSelectedString += project.name;
            if (index !== (vm.projects.length - 1)) {
              vm.projectNamesSelectedString += '・';
            }
          });
          vm.configObject = res && res.config;

          if (vm.configObject.aps) {
            vm.applyData.aps = vm.configObject.aps;
            vm.calculateAmountAndPointPlanned();
          }

          if (vm.configObject.pps) {
            vm.applyData.pps = vm.configObject.pps;
            vm.calculateAmountAndPointPlanned();
          }

          vm.apsNote = $filter('translate')('event.project_apply.form.amount_per_step.note');
          vm.apsNote = vm.apsNote.replace('{0}', $filter('format_money')(vm.configObject.aps || $scope.masterdata.MINIMUM_APS, true));

          // Require if admin setting minimum_donation_amount
          vm.isRequiredMinDonationAmount = Boolean(vm.configObject && vm.configObject.minimum_donation_amount);
          if (vm.isRequiredMinDonationAmount) {
            vm.applyData.min_donation_amount = vm.configObject.minimum_donation_amount;
            vm.minDonationAmountNote = $filter('translate')('event.project_apply.form.min_donation_amount.note');
            vm.minDonationAmountNote = vm.minDonationAmountNote.replace('{0}', $filter('format_money')(vm.configObject.minimum_donation_amount, true));
          }
          prepareErrorMessages();
          vm.municipalityName = res.municipality && res.municipality.name;
          if (res.municipality && res.municipality.methods) {
            vm.methodsOfMunicipality = _.filter($scope.masterdata.payment_methods, function (item) {
              var isExisting = _.find(res.municipality.methods, function (method) {
                return item.id === method;
              });
              return Boolean(isExisting);
            });
            vm.applyData.method = vm.methodsOfMunicipality[0].id;
          }

          // parse data for bank transfer note
          vm.bankTransferPaymentMethodNote = $filter('translate')('event.project_apply.form.payment_method.bank_transfer.note');
          vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{bank_name}', res.municipality && res.municipality.bank_name);
          vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{branch_name}', res.municipality && res.municipality.branch_name);
          var bankTypeValue = $scope.showMasterValue($scope.masterdata.bank_types, res.municipality && res.municipality.bank_type);
          vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{bank_type}', bankTypeValue);
          vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{bank_number}', res.municipality && res.municipality.bank_number);
          vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{bank_owner}', res.municipality && res.municipality.bank_owner);
          vm.bankTransferPaymentMethodNote = vm.bankTransferPaymentMethodNote.replace('{bank_owner_kana}', res.municipality && res.municipality.bank_owner_kana);
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }

    function prepareErrorMessages() {
      vm.apsMinErrorMessage = $filter('translate')('event.project_apply.form.amount_per_step.error.minimum');
      vm.apsMinErrorMessage = vm.apsMinErrorMessage.replace('{0}', vm.configObject.aps || $scope.masterdata.MINIMUM_APS);

      vm.ppsMinErrorMessage = $filter('translate')('event.project_apply.form.point_per_step.error.minimum');
      vm.ppsMinErrorMessage = vm.ppsMinErrorMessage.replace('{0}', $scope.masterdata.MINIMUM_APS);

      vm.minimumDonationAmountForFixedErrorMessage = $filter('translate')('event.project_apply.form.donation_amount.error.minimum');
      vm.minimumDonationAmountForFixedErrorMessage = vm.minimumDonationAmountForFixedErrorMessage.replace('{0}', vm.configObject.minimum_donation_amount || 0);

      vm.minimumDonationAmountPerStepErrorMessage = $filter('translate')('event.project_apply.form.min_donation_amount.error.minimum');
      vm.minimumDonationAmountPerStepErrorMessage = vm.minimumDonationAmountPerStepErrorMessage.replace('{0}', vm.configObject.minimum_donation_amount || 0);

      vm.maximumDonationAmountPerStepErrorMessage = $filter('translate')('event.project_apply.form.max_donation_amount.error.minimum');
      vm.maximumDonationAmountPerStepErrorMessage = vm.maximumDonationAmountPerStepErrorMessage.replace('{0}', vm.configObject.minimum_donation_amount || 0);
    }

    function validateDataInput() {
      var isValidData = true;

      if (vm.applyData.type === $scope.masterdata.event_type.FIXED && vm.applyData.donation_amount && vm.applyData.donation_amount < (vm.configObject.minimum_donation_amount || 0)) {
        isValidData = false;
        $scope.handleShowToast(vm.minimumDonationAmountForFixedErrorMessage, true);
        return isValidData;
      }

      if (vm.applyData.type === $scope.masterdata.event_type.FLOATING && vm.applyData.min_donation_amount && vm.applyData.min_donation_amount < (vm.configObject.minimum_donation_amount || 0)) {
        isValidData = false;
        $scope.handleShowToast(vm.minimumDonationAmountPerStepErrorMessage, true);
        return isValidData;
      }

      if (vm.applyData.type === $scope.masterdata.event_type.FLOATING && vm.applyData.min_donation_amount && vm.applyData.max_donation_amount && vm.applyData.min_donation_amount > vm.applyData.max_donation_amount) {
        isValidData = false;
        var message4 = $filter('translate')('event.project_apply.form.max_donation_amount.error.with_min_donation_amount');
        $scope.handleShowToast(message4, true);
        return isValidData;
      }

      if (vm.applyData.method !== $scope.masterdata.PAYMENT_METHOD.BANK_TRANSFER) {
        var pattern = /^\d{3}-\d{4}$|^\d{3}-\d{2}$|^\d{3}$/;
        var zipcode = vm.applyData.zipcode1 + '-' + vm.applyData.zipcode2;
        if (!validator.matches(zipcode, pattern)) {
          isValidData = false;
          var message5 = $filter('translate')('event.project_apply.form.zipcode.error.zip');
          $scope.handleShowToast(message5, true);
          return isValidData;
        }
      }

      return isValidData;
    }

    function update(isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.applyForm');
        return false;
      }

      var isValidData = validateDataInput();
      if (!isValidData) {
        return false;
      }

      if (!vm.isReadCondition) {
        var message = $filter('translate')('event.project_apply.form.controller.message.read_condition.error.required');
        $scope.handleShowToast(message, true);
        return false;
      }

      $scope.handleShowConfirm({
        message: $filter('translate')('event.project_apply.form.controller.message.confirm_save')
      }, function () {
        $scope.handleShowWaiting();
        var projectIdsSelected = _.map(vm.projects, function (project) {
          return project._id;
        });

        if (vm.applyData.method !== $scope.masterdata.PAYMENT_METHOD.BANK_TRANSFER) {
          vm.applyData.zipcode = vm.applyData.zipcode1 + '-' + vm.applyData.zipcode2;
        } else {
          vm.applyData.zipcode = null;
          vm.applyData.address = null;
          vm.applyData.name = null;
        }

        if (vm.applyData.type === $scope.masterdata.event_type.FLOATING) {
          vm.applyData.donation_amount = null;
        } else {
          // fixed
          vm.applyData.aps = null;
          vm.applyData.min_donation_amount = null;
          vm.applyData.max_donation_amount = null;
        }

        ProjectsApi.applyProjects(vm.municipalityId, vm.applyData, projectIdsSelected, vm.companyId)
          .success(function (res) {
            $scope.handleCloseWaiting();
            var message = $filter('translate')('event.project_apply.form.controller.message.save_success');
            $scope.handleShowToast(message);
            if (vm.companyId) {
              $state.go('admin.requests_registration.list');
            } else {
              $state.go('company.events.detail', { eventId: res._id });
            }
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            var message = (error && error.message) || (error && error.data && error.data.message) || $filter('translate')('event.project_apply.form.controller.message.save_failed');
            $scope.handleShowToast(message, true);
          });
      });
    }

    function multiply(a, b) {
      var commonMultiplier = 1000000;

      a = a * commonMultiplier;
      b = b * commonMultiplier;

      return (a * b) / (commonMultiplier * commonMultiplier);
    }

    vm.calculateAmountAndPointPlanned = function () {
      if (
        !vm.applyData.aps || vm.applyData.aps < 0
        || !vm.numberOfParticipant || vm.numberOfParticipant < 0
        || !vm.averageNumberOfStepPerDay || vm.averageNumberOfStepPerDay < 0
      ) {
        vm.donationAmountPlanned = 0;
      } else {
        vm.donationAmountPlanned = vm.applyData.aps * vm.averageNumberOfStepPerDay * vm.numberOfParticipant * numberOfDaysOfEvent;
      }

      if (
        !vm.applyData.pps || vm.applyData.pps < 0
        || !vm.averageNumberOfStepPerDay || vm.averageNumberOfStepPerDay < 0
      ) {
        vm.donationPointPlanned = 0;
      } else {
        vm.donationPointPlanned = vm.applyData.pps * vm.averageNumberOfStepPerDay * numberOfDaysOfEvent;
      }
    };

    vm.isErrorRequiredZipcode = function () {
      return vm.applyData.method !== $scope.masterdata.PAYMENT_METHOD.BANK_TRANSFER && (!vm.applyData.zipcode1 || !vm.applyData.zipcode2);
    };
  }
}());
