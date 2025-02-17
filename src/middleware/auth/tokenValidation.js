const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../error/errorTypes');

class TokenValidation {
    static generateToken(user, expiresIn = '24h') {
        try {
            const payload = {
                id: user._id,
                role: user.role,
                employeeId: user.employeeId // for admins
            };

            // Only add email if it exists (for regular users)
            if (user.email) {
                payload.email = user.email;
            }

            return jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn }
            );
        } catch (error) {
            throw new AuthenticationError('Error generating token');
        }
    }

    static verifyToken(token) {
        try {
            if (!token) {
                throw new AuthenticationError('No token provided');
            }

            // Remove 'Bearer ' if present
            const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
            
            return jwt.verify(tokenString, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new AuthenticationError('Token has expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new AuthenticationError('Invalid token');
            }
            throw new AuthenticationError('Token verification failed');
        }
    }

    static generatePasswordResetToken(userId) {
        try {
            return jwt.sign(
                { userId },
                process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
        } catch (error) {
            throw new AuthenticationError('Error generating reset token');
        }
    }

    static verifyPasswordResetToken(token) {
        try {
            return jwt.verify(
                token, 
                process.env.JWT_RESET_SECRET || process.env.JWT_SECRET
            );
        } catch (error) {
            throw new AuthenticationError('Invalid or expired reset token');
        }
    }

    static refreshToken(token) {
        try {
            // Remove 'Bearer ' if present
            const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
            
            const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
            
            // Create fresh payload
            const payload = {
                id: decoded.id,
                role: decoded.role,
                employeeId: decoded.employeeId
            };

            if (decoded.email) {
                payload.email = decoded.email;
            }

            return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new AuthenticationError('Token has expired');
            }
            throw new AuthenticationError('Invalid refresh token');
        }
    }

    static decodeToken(token) {
        try {
            // Remove 'Bearer ' if present
            const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
            return jwt.decode(tokenString);
        } catch (error) {
            throw new AuthenticationError('Error decoding token');
        }
    }
}

module.exports = TokenValidation;
