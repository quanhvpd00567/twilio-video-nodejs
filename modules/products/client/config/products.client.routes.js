(function () {
  'use strict';

  angular
    .module('products.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.products', {
        abstract: true,
        url: '/products',
        template: '<ui-view/>'
      })
      .state('admin.products.list', {
        url: '?{municipalityId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/products/client/views/products-list.client.view.html',
        controller: 'ProductListController',
        controllerAs: 'vm',
        data: {
          roles: ['municipality', 'admin'],
          pageTitle: '返礼品一覧'
        }
      })
      .state('admin.products.create', {
        url: '/create?{municipalityId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/products/client/views/products-form.client.view.html',
        controller: 'ProductFormController',
        controllerAs: 'vm',
        resolve: {
          product: newProduct
        },
        data: {
          roles: ['municipality', 'admin'],
          pageTitle: '返礼品追加'
        }
      })
      .state('admin.products.edit', {
        url: '/:productId/edit?{municipalityId: string}&{requestItemId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/products/client/views/products-form.client.view.html',
        controller: 'ProductFormController',
        controllerAs: 'vm',
        resolve: {
          product: getDetail
        },
        data: {
          roles: ['municipality', 'admin'],
          pageTitle: '返礼品更新'
        }
      })

      .state('admin.products.detail', {
        url: '/:productId/detail?{municipalityId: string}}',
        templateUrl: '/modules/products/client/views/products-detail.client.view.html',
        controller: 'ProductDetailController',
        controllerAs: 'vm',
        resolve: {
          product: getDetail
        },
        data: {
          roles: ['municipality', 'admin'],
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
