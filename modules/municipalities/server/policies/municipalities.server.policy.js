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
    roles: ['admin', 'sub_admin', 'company'],
    allows: [{
      resources: '/api/municipalities',
      permissions: '*'
    }, {
      resources: '/api/municipalities/all',
      permissions: '*'
    }, {
      resources: '/api/municipalities/:municId',
      permissions: '*'
    }, {
      resources: '/api/municipalities/:companyId/account/create',
      permissions: '*'
    }, {
      resources: '/api/municipalities/accounts/:companyAdminId',
      permissions: '*'
    }]
  }, {
    roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
    allows: [{
      resources: '/api/municipalities/info',
      permissions: '*'
    }, {
      resources: '/api/municipalities/update-info',
      permissions: ['*']
    }, {
      resources: '/api/municipalities/check-update-payment-method',
      permissions: ['*']
    }, {
      resources: '/api/municipalities/update-munic',
      permissions: ['*']
    }]
  }, {
    roles: ['admin', 'sub_admin', 'company'],
    allows: [{
      resources: '/api/municipalities/list-has-project-in-period',
      permissions: '*'
    }]
  }, {
    roles: ['company', 'employee'],
    allows: [{
      resources: '/api/municipalities/:municipalityId/contact-info',
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

