'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Credits Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin',],
    allows: [{
      resources: '/api/credits/add',
      permissions: '*'
    }, {
      resources: '/api/credits/update',
      permissions: '*'
    }, {
      resources: '/api/credits/delete',
      permissions: '*'
    }, {
      resources: '/api/credits/pay',
      permissions: '*'
    }, {
      resources: '/api/credits/info',
      permissions: '*'
    }, {
      resources: '/api/credits/token',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If Credits Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : [];
  if (roles.length === 0) return res.status(403).json({ message: 'アクセス権限が必要。' });
  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) return res.status(500).send('サーバーでエラーが発生しました。');
    if (!isAllowed) return res.status(403).json({ message: 'アクセス権限が必要。' });
    return next();
  });
};

