(function () {
  'use strict';

  angular
    .module('notices.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.notices', {
        abstract: true,
        url: '/notices',
        template: '<ui-view/>'
      })
      .state('admin.notices.list', {
        url: '',
        templateUrl: '/modules/notices/client/views/notice-list.client.view.html',
        controller: 'NoticeListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: 'お知らせ一覧'
        }
      })
      .state('admin.notices.create', {
        url: '/create?{cloneNoticeId: string}',
        templateUrl: '/modules/notices/client/views/notice-form.client.view.html',
        controller: 'NoticeFormController',
        controllerAs: 'vm',
        resolve: {
          noticeResolve: newNotice
        },
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: 'お知らせ登録'
        }
      })
      .state('admin.notices.edit', {
        url: '/:noticeId/edit',
        templateUrl: '/modules/notices/client/views/notice-form.client.view.html',
        controller: 'NoticeFormController',
        controllerAs: 'vm',
        resolve: {
          noticeResolve: getNotice
        },
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: 'お知らせ編集'
        }
      })
      .state('admin.notices.detail', {
        url: '/:noticeId/detail',
        templateUrl: '/modules/notices/client/views/notice-detail.client.view.html',
        controller: 'NoticeDetailController',
        controllerAs: 'vm',
        data: {
          roles: ['admin', 'sub_admin'],
          pageTitle: 'お知らせ詳細'
        }
      });

    getNotice.$inject = ['$stateParams', 'NoticesService'];
    function getNotice($stateParams, NoticesService) {
      return NoticesService.get({
        noticeId: $stateParams.noticeId
      }).$promise;
    }

    newNotice.$inject = ['$stateParams', 'NoticesService'];
    function newNotice($stateParams, NoticesService) {
      if ($stateParams.cloneNoticeId) {
        return NoticesService.get({
          noticeId: $stateParams.cloneNoticeId
        }).$promise;
      }

      return new NoticesService();
    }
  }
}());
