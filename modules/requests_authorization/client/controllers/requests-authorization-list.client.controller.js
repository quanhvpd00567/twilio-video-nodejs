(function () {
  'use strict';

  angular
    .module('requests_authorization.municipality')
    .controller('RequestsAuthorizationListController', RequestsAuthorizationListController);

  RequestsAuthorizationListController.$inject = ['$scope', '$stateParams', 'RequestsAuthorizationApi', '$filter', 'ngDialog', '$state'];

  function RequestsAuthorizationListController($scope, $stateParams, RequestsAuthorizationApi, $filter, ngDialog, $state) {
    var vm = this;
    onCreate();

    function onCreate() {
      prepareCondition(false);
      handleSearch();
    }

    function prepareCondition(clear) {
      vm.condition = $scope.prepareCondition('requests_authorization', clear);
      vm.condition.sort_column = 'start';
      vm.condition.sort_direction = '-';
    }

    function handleSearch(isShowingWaiting) {
      if (!isShowingWaiting) {
        $scope.handleShowWaiting();
      }
      RequestsAuthorizationApi.list(vm.condition)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.docs = res.docs;
          vm.condition.count = res.docs.length;
          vm.condition.page = res.page;
          vm.condition.total = res.totalDocs;
          $scope.conditionFactoryUpdate('requests_authorization', vm.condition);
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
    }

    /** start handle search, sort & paging */
    vm.handleConditionChange = function () {
      vm.isChanged = true;
    };
    vm.handleConditionChanged = function (changed, key, old) {
      if (!changed && (key === 'created_max')) {
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
    /** end handle search, sort & paging */

    vm.buildRequestTitle = function (request) {
      var featureItem = _.find($scope.masterdata.features_municipality, function (item) {
        return item.id === request.type;
      });
      return request.number + ' / ' + (featureItem && featureItem.requestTitle || '');
    };

    vm.approveRequest = function (requestId) {
      $scope.handleShowConfirm({
        message: $filter('translate')('request_authorization.list.controller.message.confirm_approve')
      }, function () {
        $scope.handleShowWaiting();
        RequestsAuthorizationApi.approve(requestId)
          .success(function (res) {
            var message = $filter('translate')('request_authorization.list.controller.message.approve_success');
            $scope.handleShowToast(message);

            handleSearch(true);
          }).error(function (error) {
            $scope.handleCloseWaiting();
            $scope.handleShowToast($scope.parseErrorMessage(error), true);
          });
      });
    };

    vm.collapseRequest = function (request) {
      request.isShow = !request.isShow;
    };

    vm.rejectRequest = function (requestId) {
      $scope.showModal = true;
      ngDialog
        .openConfirm({
          templateUrl:
            '/modules/requests_authorization/client/views/modal/modal-input-reject-request-reason.client.view.html',
          scope: $scope,
          showClose: false,
          closeByDocument: false,
          width: 800,
          controller: 'ModalInputRejectRequestReasonController',
          controllerAs: 'vm'
        })
        .then(function (rejectReason) {
          $scope.showModal = false;
          if (!rejectReason) {
            return;
          }

          $scope.handleShowWaiting();
          RequestsAuthorizationApi.reject(requestId, rejectReason)
            .success(function (res) {
              var message = $filter('translate')('request_authorization.list.controller.message.reject_success');
              $scope.handleShowToast(message);

              handleSearch(true);
            })
            .error(function (error) {
              $scope.handleCloseWaiting();
              $scope.handleShowToast($scope.parseErrorMessage(error), true);
            });
        });
    };

    vm.deleteRequest = function (requestId) {
      $scope.handleShowConfirm({
        message: $filter('translate')('request_authorization.list.controller.message.confirm_delete')
      }, function () {
        $scope.handleShowWaiting();
        RequestsAuthorizationApi.delete(requestId)
          .success(function (res) {
            var message = $filter('translate')('request_authorization.list.controller.message.delete_success');
            $scope.handleShowToast(message);

            handleSearch(true);
          }).error(function (error) {
            $scope.handleCloseWaiting();
            $scope.handleShowToast($scope.parseErrorMessage(error), true);
          });
      });
    };

    vm.goDetailRequestItem = function (request, requestItem) {
      if (request.type.includes('project')) {
        $state.go('municipality.projects.detail', {
          projectId: requestItem.project && requestItem.project._id || requestItem._id,
          municipalityId: request.municipality._id || request.municipality,
          requestItemId: requestItem._id
        });
      }
      if (request.type.includes('product')) {
        $state.go('municipality.products.detail', {
          productId: requestItem.product && requestItem.product._id || requestItem._id,
          municipalityId: request.municipality._id || request.municipality,
          requestItemId: requestItem._id
        });
      }
      if (request.type.includes('using')) {
        $state.go('municipality.usings.detail', {
          usingId: requestItem.using && requestItem.using._id || requestItem._id,
          municipalityId: request.municipality._id || request.municipality,
          requestItemId: requestItem._id
        });
      }
      if (request.type.includes('munic_member')) {
        $state.go('municipality.munic_members.detail', {
          memberId: requestItem.user && requestItem.user._id || requestItem._id,
          municipalityId: request.municipality._id || request.municipality,
          requestItemId: requestItem._id
        });
      }
      if (request.type.includes('munic_info')) {
        $state.go('municipality.munic.settings', {
          municipalityId: request.municipality._id || request.municipality,
          requestStatus: 'detail',
          requestItemId: requestItem._id,
          key: request.type
        });
      }
      if (request.type.includes('tax_payment')) {
        $state.go('municipality.munic_product_config.product-config', {
          municipalityId: request.municipality._id || request.municipality,
          requestStatus: 'detail',
          requestItemId: requestItem._id,
          key: request.type
        });
      }
    };
  }
}());
