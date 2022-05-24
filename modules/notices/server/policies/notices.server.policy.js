'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke notices Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin', 'sub_admin'],
    allows: [{
      resources: '/api/notices',
      permissions: '*'
    }, {
      resources: '/api/notices/:noticeId',
      permissions: '*'
    }, {
      resources: '/api/notices/:noticeId/detail',
      permissions: '*'
    }, {
      resources: '/api/notices/paging',
      permissions: '*'
    }, {
      resources: '/api/notices/stop',
      permissions: '*'
    }, {
      resources: '/api/notices/listAppNotice',
      permissions: '*'
    }, {
      resources: '/api/notices/export',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If notices Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : [];
  if (roles.length === 0) return res.status(403).json({ notice: 'アクセス権限が必要。' });

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) return res.status(500).send('サーバーでエラーが発生しました。');
    if (!isAllowed) return res.status(403).json({ notice: 'アクセス権限が必要。' });
    return next();
  });
};

