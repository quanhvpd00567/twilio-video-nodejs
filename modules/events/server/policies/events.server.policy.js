'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke events Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['company', 'admin', 'sub_admin'],
    allows: [{
      resources: '/api/events/:eventId',
      permissions: '*'
    }, {
      resources: '/api/events',
      permissions: '*'
    }, {
      resources: '/api/events/paging',
      permissions: '*'
    }, {
      resources: '/api/events/paging_home',
      permissions: '*'
    }, {
      resources: '/api/events/opening_home',
      permissions: '*'
    }, {
      resources: '/api/events/detail/:eventId',
      permissions: '*'
    }, {
      resources: '/api/events/export',
      permissions: '*'
    }, {
      resources: '/api/:municipalityId/projects/apply',
      permissions: '*'
    }, {
      resources: '/api/events/:eventId/comprojects/paging',
      permissions: '*'
    }]
  }, {
    roles: ['company', 'admin', 'sub_admin'],
    allows: [{
      resources: '/api/:municipalityId/projects/apply',
      permissions: '*'
    }, {
      resources: '/api/events/:eventId',
      permissions: '*'
    }, {
      resources: '/api/events',
      permissions: '*'
    }, {
      resources: '/api/events/paging',
      permissions: '*'
    }]
  }, {
    roles: ['munic_admin', 'munic_member', 'admin', 'sub_admin'],
    allows: [{
      resources: '/api/events/paging-municipality',
      permissions: '*'
    }, {
      resources: '/api/events/:eventId/comprojects/paging',
      permissions: '*'
    }, {
      resources: '/api/events/detail/:eventId',
      permissions: '*'
    }, {
      resources: '/api/events/:eventId',
      permissions: '*'
    }, {
      resources: '/api/events/:eventId/update-pay-and-send-status',
      permissions: '*'
    }, {
      resources: '/api/events/munic-export',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If events Policy Allows
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

