'use strict';

/**
 * Module dependencies
 */
var acl = require('acl'),
  path = require('path'),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Admin Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/users',
      permissions: '*'
    }, {
      resources: '/api/users/:userId',
      permissions: '*'
    }, {
      resources: '/api/users/paging',
      permissions: '*'
    }, {
      resources: '/api/user/home_info',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If Admin Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : [];
  if (roles.length === 0) return res.status(403).json({ message: help.getMsLoc('ja', 'common.server.error.permission') });
  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) return res.status(500).send(help.getMsLoc('ja', 'common.server.error'));
    if (!isAllowed) return res.status(403).json({ message: help.getMsLoc('ja', 'common.server.error.permission') });
    return next();
  });
};
