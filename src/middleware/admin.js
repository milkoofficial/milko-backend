const { AuthorizationError } = require('../utils/errors');

/**
 * Admin Authorization Middleware
 * Requires user to be authenticated AND have admin role
 * Must be used after authenticate middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return next(new AuthorizationError('Admin access required'));
  }

  next();
};

module.exports = {
  requireAdmin,
};

