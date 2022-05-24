'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke usings Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
    allows: [{
      resources: '/api/usings',
      permissions: '*'
    }, {
      resources: '/api/usings/:usingId',
      permissions: '*'
    }, {
      resources: '/api/usings/paging',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If usings Policy Allows
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

