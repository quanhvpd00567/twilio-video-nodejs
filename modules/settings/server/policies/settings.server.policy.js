'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke settings Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin', 'sub_admin', 'consultant', 'user', 'manager'],
    allows: [{
      resources: '/api/settings',
      permissions: '*'
    }, {
      resources: '/api/settings/config',
      permissions: '*'
    }, {
      resources: '/api/settings/pushVersion',
      permissions: '*'
    },
    {
      resources: '/api/settings/pps/paging',
      permissions: '*'
    },
    {
      resources: '/api/settings/aps/paging',
      permissions: '*'
    },
    {
      resources: '/api/settings/config-set/add-or-update',
      permissions: '*'
    },
    {
      resources: '/api/settings/config-set/delete',
      permissions: '*'
    }]
  }, {
    roles: ['employee'],
    allows: [{
      resources: '/api/settings',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If settings Policy Allows
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

