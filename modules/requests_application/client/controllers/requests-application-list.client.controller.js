(function () {
  'use strict';

  angular
    .module('requests_application.municipality')
    .controller('RequestsApplicationListController', RequestsApplicationListController);

  RequestsApplicationListController.$inject = ['$scope', 'ngDialog', '$state', 'RequestsApplicationApi', '$filter'];

  function RequestsApplicationListController($scope, ngDialog, $state, RequestsApplicationApi, $filter) {
    var vm = this;
    vm.request = [];
    vm.rejecteds = [];
    vm.waitings = [];
    vm.MunicFeatures = $scope.masterdata.features_municipality;
    onCreate();

    function onCreate() {
      $scope.handleShowWaiting();
      RequestsApplicationApi.list()
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.requests = res.requests;
          vm.rejecteds = res.rejecteds;
          vm.waitings = res.waitings;
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          $scope.handleShowToast($scope.parseErrorMessage(error), true);
        });
    }

    vm.submit = function (groups) {
      $scope.handleShowConfirm({
        message: $filter('translate')('request_application.list.controller.message.confirm_submit')
      }, function () {
        var group = groups && groups[0] || {};
        var requestItemIds = groups.map(function (i) {
          return i._id;
        });

        $scope.handleShowWaiting();
        RequestsApplicationApi.submit({ municipality: group.municipality, type: group.type, requestItemIds: requestItemIds })
          .success(function (res) {
            var message = $filter('translate')('request_application.list.controller.message.submit_success');
            $scope.handleShowToast(message);

            $scope.handleCloseWaiting();
            onCreate();
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            $scope.handleShowToast($scope.parseErrorMessage(error), true);
          });
      });
    };

    vm.resubmit = function (request) {
      ngDialog.openConfirm({
        templateUrl: '/modules/requests_application/client/views/template/reject-modal.client.view.html',
        scope: $scope,
        showClose: false,
        closeByDocument: false,
        closeByEscape: false,
        width: 600,
        controller: ['$scope', function ($scope) {
          $scope.confirm = function () {
            $scope.handleShowConfirm({
              message: '再申請します。よろしいですか？'
            }, function () {
              $scope.closeThisDialog();
              $scope.handleShowWaiting();
              RequestsApplicationApi.resubmit({ _id: request._id, reason: $scope.reason })
                .success(function (res) {
                  $scope.handleCloseWaiting();
                  onCreate();
                })
                .error(function (error) {
                  $scope.handleCloseWaiting();
                  $scope.handleShowToast($scope.parseErrorMessage(error), true);
                });
            });
          };
        }]
      });
    };

    vm.removeRequestItem = function (request) {
      $scope.handleShowConfirm({
        message: $filter('translate')('request_application.list.controller.message.confirm_delete_request_item')
      }, function () {
        $scope.handleShowWaiting();
        RequestsApplicationApi.removeRequestItem(request)
          .success(function (res) {
            var message = $filter('translate')('request_application.list.controller.message.delete_request_item_success');
            $scope.handleShowToast(message);

            $scope.handleCloseWaiting();
            onCreate();
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            $scope.handleShowToast($scope.parseErrorMessage(error), true);
          });
      });
    };

    vm.updateRequestItem = function (request, requestItem) {
      if (request.type.includes('project')) {
        $state.go('municipality.projects.edit', {
          projectId: requestItem.project && requestItem.project._id || requestItem._id,
          municipalityId: request.municipality._id || request.municipality,
          requestItemId: requestItem._id
        });
      }
      if (request.type.includes('product')) {
        $state.go('municipality.products.edit', {
          productId: requestItem.product && requestItem.product._id || requestItem._id,
          municipalityId: request.municipality._id || request.municipality,
          requestItemId: requestItem._id
        });
      }
      if (request.type.includes('using')) {
        $state.go('municipality.usings.edit', {
          usingId: requestItem.using && requestItem.using._id || requestItem._id,
          municipalityId: request.municipality._id || request.municipality,
          requestItemId: requestItem._id
        });
      }
      if (request.type.includes('munic_member')) {
        $state.go('municipality.munic_members.edit', {
          memberId: requestItem.user && requestItem.user._id || requestItem._id,
          municipalityId: request.municipality._id || request.municipality,
          requestItemId: requestItem._id
        });
      }
      if (request.type.includes('munic_info')) {
        $state.go('municipality.munic.settings', {
          municipalityId: request.municipality._id || request.municipality,
          requestStatus: 'update',
          key: request.type,
          requestItemId: requestItem._id
        });
      }
      if (request.type.includes('tax_payment')) {
        $state.go('municipality.munic_product_config.product-config', {
          municipalityId: request.municipality._id || request.municipality,
          requestStatus: 'update',
          key: request.type,
          requestItemId: requestItem._id
        });
      }
    };

    vm.goDetail = function (request, requestItem) {
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

    vm.removeRequest = function (request) {
      $scope.handleShowConfirm({
        message: $filter('translate')('request_application.list.controller.message.confirm_delete_request')
      }, function () {
        $scope.handleShowWaiting();
        RequestsApplicationApi.removeRequest(request)
          .success(function (res) {
            var message = $filter('translate')('request_application.list.controller.message.delete_request_success');
            $scope.handleShowToast(message);

            $scope.handleCloseWaiting();
            onCreate();
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            $scope.handleShowToast($scope.parseErrorMessage(error), true);
          });
      });
    };

    vm.buildRequestTitle = function (request) {
      var featureItem = _.find($scope.masterdata.features_municipality, function (item) {
        return item.id === request.type;
      });
      return request.number + ' / ' + (request.municipality && request.municipality.name) + ' / ' + (featureItem && featureItem.requestTitle || '');
    };

    vm.buildRequestTitleForPendingRequestItem = function (type) {
      var featureItem = _.find($scope.masterdata.features_municipality, function (item) {
        return item.id === type;
      });
      return (featureItem && featureItem.requestTitle || '');
    };

    vm.collapseRequest = function (request) {
      request.isShow = !request.isShow;
    };

    vm.isShowEditOrDetail = function (request) {
      return !request.type.includes('delete');
    };
  }
}());
