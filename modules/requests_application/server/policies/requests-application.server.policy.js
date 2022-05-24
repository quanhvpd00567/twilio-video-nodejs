'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke requests-application Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin', 'sub_admin', 'munic_admin', 'munic_member'],
    allows: [{
      resources: '/api/requests-items',
      permissions: '*'
    }, {
      resources: '/api/requests-items/:requestItemId',
      permissions: '*'
    }, {
      resources: '/api/submit-application',
      permissions: '*'
    }, {
      resources: '/api/resubmit-application',
      permissions: '*'
    }, {
      resources: '/api/remove-request-application',
      permissions: '*'
    }, {
      resources: '/api/remove-request-item-application',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If requests-application Policy Allows
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

