(function () {
  'use strict';

  angular
    .module('notices.admin')
    .controller('NoticeDetailController', NoticeDetailController);

  NoticeDetailController.$inject = ['$scope', 'NoticesHelper', '$stateParams', 'NoticesApi', '$filter', '$state'];

  function NoticeDetailController($scope, NoticesHelper, $stateParams, NoticesApi, $filter, $state) {
    var vm = this;
    var noticeId = $stateParams.noticeId;
    vm.noticeId = noticeId;
    vm.notice = {};
    vm.NoticesHelper = NoticesHelper;
    vm.NOTICE_TARGET = {
      ALL: 1,
      CONDITION: 2
    };
    onCreate();

    function onCreate() {
      $scope.handleShowWaiting();
      NoticesApi.detail(noticeId)
        .success(function (res) {
          $scope.handleCloseWaiting();
          vm.notice = res;
          if (!vm.notice) {
            var message = $filter('translate')('common.data.failed');
            $scope.handleShowToast(message, true);
            $state.go('admin.notices.list');
            return;
          }

          if (vm.notice.municipalities) {
            var municipalitiesName = _.map(vm.notice.municipalities, function (item) {
              return item.name;
            });
            vm.notice.municipalitiesName = municipalitiesName.join(', ');
          }
          if (vm.notice.companies) {
            var companiesName = _.map(vm.notice.companies, function (item) {
              var name = $filter('get_company_name')(item.name, item.kind, $scope.masterdata.company_name_affix, $scope.masterdata.COMPANY_KIND);
              return name;
            });
            vm.notice.companiesName = companiesName.join(', ');
          }
        })
        .error(function (error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('common.data.failed');
          $scope.handleShowToast(message, true);
        });
    }
  }
}());
