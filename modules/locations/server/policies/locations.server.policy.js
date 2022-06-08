'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke locations Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/locations',
      permissions: '*'
    }, {
      resources: '/api/locations/:locationId',
      permissions: '*'
    }, {
      resources: '/api/locations/paging',
      permissions: '*'
    }, {
      resources: '/api/locations/export',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If locations Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : [];
  if (roles.length === 0) return res.status(403).json({ location: 'アクセス権限が必要。' });

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) return res.status(500).send('サーバーでエラーが発生しました。');
    if (!isAllowed) return res.status(403).json({ location: 'アクセス権限が必要。' });
    return next();
  });
};

