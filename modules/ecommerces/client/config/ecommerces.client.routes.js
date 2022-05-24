(function () {
  'use strict';

  angular
    .module('ecommerces.company.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('company.ecommerces', {
        abstract: true,
        url: '/ecommerces',
        template: '<ui-view/>'
      })
      .state('company.ecommerces.home', {
        url: '',
        templateUrl: '/modules/ecommerces/client/views/ecommerces-home.client.view.html',
        controller: 'EcommerceHomeController',
        controllerAs: 'vm',
        data: {
          roles: ['employee', 'admin'],
          pageTitle: 'ホーム'
        }
      })
      .state('company.ecommerces.cart', {
        url: '/cart',
        templateUrl: '/modules/ecommerces/client/views/ecommerces-cart.client.view.html',
        controller: 'EcommerceCartController',
        controllerAs: 'vm',
        data: {
          roles: ['employee', 'admin'],
          pageTitle: 'ショッピングカート'
        }
      })
      .state('company.ecommerces.pay1', {
        url: '/:municId/pay-step-1?{using: string}&{isBack: string}',
        templateUrl: '/modules/ecommerces/client/views/ecommerces-pay-flow-1.client.view.html',
        controller: 'EcommercePayFlowController',
        controllerAs: 'vm',
        data: {
          roles: ['employee', 'admin'],
          pageTitle: '寄付金の使い道を選択'
        }
      })
      .state('company.ecommerces.pay2', {
        url: '/:municId/using/:usingId/pay-step-2?{isBack: string}',
        templateUrl: '/modules/ecommerces/client/views/ecommerces-pay-flow-2.client.view.html',
        controller: 'EcommercePayFlowController',
        controllerAs: 'vm',
        data: {
          roles: ['employee', 'admin'],
          pageTitle: '申し込み情報の入力'
        }
      })
      .state('company.ecommerces.pay-confirm', {
        url: '/:municId/using/:usingId/pay-confirm',
        templateUrl: '/modules/ecommerces/client/views/ecommerces-pay-flow-confirm.client.view.html',
        controller: 'EcommerceConfirmController',
        controllerAs: 'vm',
        data: {
          roles: ['employee', 'admin'],
          pageTitle: '申し込み内容の確認'
        }
      })
      .state('company.ecommerces.pay-success', {
        url: '/pay-success/:municId',
        templateUrl: '/modules/ecommerces/client/views/ecommerces-pay-flow-success.client.view.html',
        controller: 'EcommercePayFlowSuccessController',
        controllerAs: 'vm',
        data: {
          roles: ['employee', 'admin'],
          pageTitle: '申し込みと支払いの完了'
        }
      })
      .state('company.ecommerces.notice_list', {
        url: '/notices',
        templateUrl: '/modules/ecommerces/client/views/ecommerces-notice-list.client.view.html',
        controller: 'EcommerceNoticeListController',
        controllerAs: 'vm',
        data: {
          roles: ['employee', 'admin'],
          pageTitle: 'お知らせ一覧'
        }
      })
      .state('company.ecommerces.notice_detail', {
        url: '/notices/:noticeId',
        templateUrl: '/modules/ecommerces/client/views/ecommerces-notice-detail.client.view.html',
        controller: 'EcommerceNoticeDetailController',
        controllerAs: 'vm',
        data: {
          roles: ['employee', 'admin'],
          pageTitle: 'お知らせ詳細'
        }
      })
      .state('company.ecommerces.history', {
        url: '/history',
        templateUrl: '/modules/ecommerces/client/views/ecommerces-history.client.view.html',
        controller: 'EcommerceHistoryController',
        controllerAs: 'vm',
        data: {
          roles: ['employee', 'admin'],
          pageTitle: '注文履歴'
        }
      })
      .state('company.ecommerces.history-detail', {
        url: '/history/:orderId',
        templateUrl: '/modules/ecommerces/client/views/ecommerces-history-detail.client.view.html',
        controller: 'EcommerceHistoryDetailController',
        controllerAs: 'vm',
        data: {
          roles: ['employee', 'admin'],
          pageTitle: '申し込み内容の確認'
        }
      })
      .state('company.ecommerces.product-detail', {
        url: '/product/:productId/:municId',
        templateUrl: '/modules/ecommerces/client/views/ecommerces-product-detail.client.view.html',
        controller: 'EcommerceProductDetailController',
        controllerAs: 'vm',
        data: {
          roles: ['employee', 'admin'],
          pageTitle: '返礼品詳細'
        }
      });
  }
}());
