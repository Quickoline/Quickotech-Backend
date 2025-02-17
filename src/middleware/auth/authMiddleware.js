const { AuthenticationError } = require('../error/errorTypes');
const User = require('../../api/v1/auth/models/user.model');
const Admin = require('../../api/v1/auth/models/admin.model');
const TokenValidation = require('./tokenValidation');

const authMiddleware = {
    verifyToken: async (req, res, next) => {
        try {
            const token = req.headers.authorization;
            
            if (!token) {
                throw new AuthenticationError('No token provided');
            }

            const decoded = TokenValidation.verifyToken(token);
            
            // Check if user exists
            const user = decoded.role.includes('admin') ? 
                await Admin.findById(decoded.id) : 
                await User.findById(decoded.id);

            if (!user) {
                throw new AuthenticationError('User not found');
            }

            req.user = user;
            next();
        } catch (error) {
            next(new AuthenticationError(error.message));
        }
    },

    // Socket authentication middleware
    verifySocketToken: (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                throw new AuthenticationError('No token provided');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new AuthenticationError('Invalid socket token'));
        }
    },

    // Optional authentication for public endpoints
    optionalAuth: async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = decoded.isAdmin ? 
                    await Admin.findById(decoded.id) : 
                    await User.findById(decoded.id);
                req.user = user;
            }
            next();
        } catch (error) {
            // Continue without authentication
            next();
        }
    },

    // Only for user routes
    isUser: (req, res, next) => {
        if (req.user.role !== 'user') {
            next(new AuthenticationError('Access denied. User only.'));
        }
        next();
    },

    // Admin level checks
    isAdmin: (req, res, next) => {
        const adminRoles = ['app_admin', 'web_admin', 'senior_admin', 'super_admin'];
        if (!adminRoles.includes(req.user.role)) {
            next(new AuthenticationError('Access denied. Admin only.'));
        }
        next();
    },

    isSuperAdmin: (req, res, next) => {
        if (req.user.role !== 'super_admin') {
            next(new AuthenticationError('Access denied. Super admin only.'));
        }
        next();
    }
};

module.exports = authMiddleware;
