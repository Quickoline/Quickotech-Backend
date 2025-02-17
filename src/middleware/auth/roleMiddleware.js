const { AuthenticationError } = require('../error/errorTypes');

const ROLE_HIERARCHY = {
    super_admin: 4,
    senior_admin: 3,
    web_admin: 2,
    app_admin: 1,
    user: 0
};

const roleMiddleware = {
    hasRole: (requiredRole) => (req, res, next) => {
        try {
            if (!req.user || !req.user.role) {
                throw new AuthenticationError('Authentication required');
            }

            const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
            const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0;

            if (userRoleLevel < requiredRoleLevel) {
                throw new AuthenticationError('Insufficient privileges');
            }

            next();
        } catch (error) {
            next(error);
        }
    },

    // Middleware for blog endpoints
    canManageBlog: (req, res, next) => {
        const allowedRoles = ['super_admin', 'senior_admin', 'web_admin'];
        if (!allowedRoles.includes(req.user.role)) {
            return next(new AuthenticationError('Insufficient privileges to manage blog'));
        }
        next();
    },

    // Middleware for order management
    canManageOrders: (req, res, next) => {
        const allowedRoles = ['super_admin', 'senior_admin', 'app_admin'];
        if (!allowedRoles.includes(req.user.role)) {
            return next(new AuthenticationError('Insufficient privileges to manage orders'));
        }
        next();
    },

    // Middleware for product management
    canManageProducts: (req, res, next) => {
        const allowedRoles = ['super_admin', 'senior_admin'];
        if (!allowedRoles.includes(req.user.role)) {
            return next(new AuthenticationError('Insufficient privileges to manage products'));
        }
        next();
    },

    // Middleware for template management
    canManageTemplates: (req, res, next) => {
        const allowedRoles = ['super_admin', 'senior_admin'];
        if (!allowedRoles.includes(req.user.role)) {
            return next(new AuthenticationError('Insufficient privileges to manage templates'));
        }
        next();
    }
};

module.exports = roleMiddleware;
