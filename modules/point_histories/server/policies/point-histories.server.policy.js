'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke point-histories Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin', 'sub_admin'],
    allows: [{
      resources: '/api/point-histories/current',
      permissions: '*'
    }, {
      resources: '/api/point-histories/used',
      permissions: '*'
    }, {
      resources: '/api/point-histories/expired',
      permissions: '*'
    }, {
      resources: '/api/point-histories/:paymentHistoryId/update-payment-status',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If point-histories Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : [];
  if (roles.length === 0) return res.status(403).json({ pointHistory: 'アクセス権限が必要。' });

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) return res.status(500).send('サーバーでエラーが発生しました。');
    if (!isAllowed) return res.status(403).json({ pointHistory: 'アクセス権限が必要。' });
    return next();
  });
};

