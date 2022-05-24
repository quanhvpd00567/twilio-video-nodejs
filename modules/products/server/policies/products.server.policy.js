'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke participants Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    // list api only role munic
    roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
    allows: [{
      resources: '/api/products',
      permissions: '*'
    }, {
      resources: '/api/products/:productId',
      permissions: '*'
    }, {
      resources: '/api/products/image',
      permissions: '*'
    }, {
      resources: '/api/products/upload-pictures',
      permissions: '*'
    }, {
      resources: '/api/products/has-using',
      permissions: '*'
    }, {
      resources: '/api/municipality',
      permissions: '*'
    }]
  }, {
    roles: ['admin', 'sub_admin'],
    allows: [{
      resources: '/api/products/:productId',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If participants Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : [];
  if (roles.length === 0) return res.status(403).json({ event: 'アクセス権限が必要。' });

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) return res.status(500).send('サーバーでエラーが発生しました。');
    if (!isAllowed) return res.status(403).json({ event: 'アクセス権限が必要。' });
    return next();
  });
};

