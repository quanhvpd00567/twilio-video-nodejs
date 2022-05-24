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
    // list api only role admin
    roles: ['admin', 'sub_admin'],
    allows: [{
      resources: '/api/companies',
      permissions: '*'
    }, {
      resources: '/api/companies/all',
      permissions: '*'
    }, {
      resources: '/api/companies/:companyId',
      permissions: '*'
    }, {
      resources: '/api/companies/:companyId/account/create',
      permissions: '*'
    }, {
      resources: '/api/companies/accounts/:companyAdminId',
      permissions: '*'
    }]
  }, {
    roles: ['company', 'admin', 'sub_admin'],
    allows: [{
      resources: '/api/companies',
      permissions: '*'
    }, {
      resources: '/api/companies/:companyId',
      permissions: '*'
    }]
  }, {
    // list api only role admin and company
    roles: ['company', 'admin', 'sub_admin'],
    allows: [{
      resources: '/api/companies/:companyId',
      permissions: ['get', 'put']
    }, {
      resources: '/api/company/info',
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

