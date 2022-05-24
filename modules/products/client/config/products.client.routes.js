(function () {
  'use strict';

  angular
    .module('products.municipality.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.products', {
        abstract: true,
        url: '/products',
        template: '<ui-view/>'
      })
      .state('municipality.products.list', {
        url: '?{municipalityId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/products/client/views/products-list.client.view.html',
        controller: 'ProductListController',
        controllerAs: 'vm',
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: '返礼品一覧'
        }
      })
      .state('municipality.products.create', {
        url: '/create?{municipalityId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/products/client/views/products-form.client.view.html',
        controller: 'ProductFormController',
        controllerAs: 'vm',
        resolve: {
          product: newProduct
        },
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: '返礼品追加'
        }
      })
      .state('municipality.products.edit', {
        url: '/:productId/edit?{municipalityId: string}&{requestItemId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/products/client/views/products-form.client.view.html',
        controller: 'ProductFormController',
        controllerAs: 'vm',
        resolve: {
          product: getDetail
        },
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: '返礼品更新'
        }
      })

      .state('municipality.products.detail', {
        url: '/:productId/detail?{municipalityId: string}&{requestItemId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/products/client/views/products-detail.client.view.html',
        controller: 'ProductDetailController',
        controllerAs: 'vm',
        resolve: {
          product: getDetail
        },
        data: {
          roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
          pageTitle: '返礼品詳細'
        }
      });

    getDetail.$inject = ['$stateParams', 'ProductService'];
    function getDetail($stateParams, ProductService) {
      return ProductService.get({
        productId: $stateParams.productId
      }).$promise;
    }

    newProduct.$inject = ['ProductService'];
    function newProduct(ProductService) {
      return new ProductService();
    }
  }
}());
