'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke ecommerces Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['employee'],
    allows: [{
      resources: '/api/munic/:municId/using',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/cart/:municId',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/cart/add-or-update',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/carts/pending',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/cart/remove-product',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/cart/:cartId',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/orders/paging',
      permissions: 'post'
    }, {
      resources: '/api/ecommerces/orders/:orderECId',
      permissions: 'get'
    }, {
      resources: '/api/ecommerces/order',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/notices/3-latest',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/notices/paging',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/notices/:noticeId',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/check-mapping-munic/:municId',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/municipalities-has-active-points',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/products/paging',
      permissions: 'post'
    }, {
      resources: '/api/ecommerces/products/:productECId',
      permissions: 'get'
    }, {
      resources: '/api/ecommerces/remove-card',
      permissions: 'post'
    }, {
      resources: '/api/ecommerces/:municId/using/:usingId',
      permissions: 'get'
    }, {
      resources: '/api/ecommerces/card/:cardId',
      permissions: 'get'
    }, {
      resources: '/api/ecommerces/cards',
      permissions: '*'
    }, {
      resources: '/api/ecommerces/order-lastest',
      permissions: 'get'
    }]
  }]);
};

/**
 * Check If ecommerces Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : [];
  if (roles.length === 0) return res.status(403).json({ ecommerce: 'アクセス権限が必要。' });

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) return res.status(500).send('サーバーでエラーが発生しました。');
    if (!isAllowed) return res.status(403).json({ ecommerce: 'アクセス権限が必要。' });
    return next();
  });
};

