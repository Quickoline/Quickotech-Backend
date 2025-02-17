const User = require('../models/user.model');
const Admin = require('../models/admin.model');
const TokenValidation = require('../../../../middleware/auth/tokenValidation');
const EmailService = require('../../../../services/email.service');
const { ValidationError, AuthenticationError, NotFoundError } = require('../../../../middleware/error/errorTypes');

class AuthController {
    // User Authentication
    async userSignup(req, res, next) {
        try {
            const { email, whatsappNumber, password } = req.body;

            // Only validate required fields
            if (!email || !whatsappNumber || !password) {
                throw new ValidationError('Email, WhatsApp number, and password are required');
            }

            // Check for existing user
            const existingUser = await User.findOne({ 
                $or: [{ email }, { whatsappNumber }] 
            });
            
            if (existingUser) {
                throw new ValidationError('Email or WhatsApp number already exists');
            }

            // Create user with only the provided fields
            const userData = {
                email,
                whatsappNumber,
                password
            };

            const user = await User.create(userData);

            const token = TokenValidation.generateToken(user);

            res.status(201).json({
                success: true,
                token,
                data: {
                    id: user._id,
                    email: user.email,
                    whatsappNumber: user.whatsappNumber,
                    role: user.role
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async userLogin(req, res, next) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email }).select('+password');
            if (!user || !(await user.comparePassword(password))) {
                throw new AuthenticationError('Invalid credentials');
            }

            const token = TokenValidation.generateToken(user);

            res.json({
                success: true,
                token
            });
        } catch (error) {
            next(error);
        }
    }

    // Admin Authentication
    async adminLogin(req, res, next) {
        try {
            const { employeeId, password } = req.body;

            const admin = await Admin.findOne({ employeeId }).select('+password');
            if (!admin || !(await admin.comparePassword(password))) {
                throw new AuthenticationError('Invalid credentials');
            }

            const token = TokenValidation.generateToken(admin);

            res.json({
                success: true,
                token
            });
        } catch (error) {
            next(error);
        }
    }

    async createAdmin(req, res, next) {
        try {
            const { employeeId, password, role, name } = req.body;

            // Validate required fields
            if (!employeeId || !password || !role || !name) {
                throw new ValidationError('All fields (employeeId, password, role, name) are required');
            }

            // Validate role
            const validRoles = ['app_admin', 'web_admin', 'senior_admin', 'super_admin'];
            if (!validRoles.includes(role)) {
                throw new ValidationError('Invalid admin role');
            }

            // Check if admin already exists
            const existingAdmin = await Admin.findOne({ employeeId });
            if (existingAdmin) {
                throw new ValidationError('Admin with this employee ID already exists');
            }

            // Create new admin with all required fields
            const admin = await Admin.create({
                employeeId,
                password,
                role,
                name,
                isActive: true
            });

            res.status(201).json({
                success: true,
                data: {
                    employeeId: admin.employeeId,
                    role: admin.role,
                    name: admin.name
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Password Reset (Users Only)
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            
            if (!user) {
                throw new NotFoundError('User not found');
            }

            const resetToken = TokenValidation.generatePasswordResetToken(user._id);
            
            await EmailService.sendPasswordResetEmail(email, resetToken);

            res.json({
                success: true,
                message: 'Password reset email sent'
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body;
            
            const decoded = TokenValidation.verifyPasswordResetToken(token);
            const user = await User.findById(decoded.userId);

            if (!user) {
                throw new NotFoundError('User not found');
            }

            user.password = password;
            await user.save();

            res.json({
                success: true,
                message: 'Password reset successful'
            });
        } catch (error) {
            next(error);
        }
    }

    // Token Refresh
    async refreshToken(req, res, next) {
        try {
            const { token } = req.body;
            const newToken = TokenValidation.refreshToken(token);

            res.json({
                success: true,
                token: newToken
            });
        } catch (error) {
            next(error);
        }
    }

    async superAdminLogin(req, res, next) {
        try {
            const { employeeId, password } = req.body;

            const admin = await Admin.findOne({ 
                employeeId,
                role: 'super_admin',
                isActive: true
            }).select('+password');

            if (!admin) {
                throw new AuthenticationError('Invalid Super Admin credentials');
            }

            const isPasswordValid = await admin.comparePassword(password);
            if (!isPasswordValid) {
                throw new AuthenticationError('Invalid Super Admin credentials');
            }

            const token = TokenValidation.generateToken(admin);

            res.json({
                success: true,
                token,
                data: {
                    employeeId: admin.employeeId,
                    role: admin.role,
                    name: admin.name
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async seniorAdminLogin(req, res, next) {
        try {
            const { employeeId, password } = req.body;

            const admin = await Admin.findOne({ 
                employeeId,
                role: 'senior_admin'
            }).select('+password');

            if (!admin || !(await admin.comparePassword(password))) {
                throw new AuthenticationError('Invalid Senior Admin credentials');
            }

            const token = TokenValidation.generateToken(admin);

            res.json({
                success: true,
                token,
                data: {
                    employeeId: admin.employeeId,
                    role: admin.role
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async webAdminLogin(req, res, next) {
        try {
            const { employeeId, password } = req.body;

            const admin = await Admin.findOne({ 
                employeeId,
                role: 'web_admin'
            }).select('+password');

            if (!admin || !(await admin.comparePassword(password))) {
                throw new AuthenticationError('Invalid Web Admin credentials');
            }

            const token = TokenValidation.generateToken(admin);

            res.json({
                success: true,
                token,
                data: {
                    employeeId: admin.employeeId,
                    role: admin.role
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async appAdminLogin(req, res, next) {
        try {
            const { employeeId, password } = req.body;

            const admin = await Admin.findOne({ 
                employeeId,
                role: 'app_admin'
            }).select('+password');

            if (!admin || !(await admin.comparePassword(password))) {
                throw new AuthenticationError('Invalid App Admin credentials');
            }

            const token = TokenValidation.generateToken(admin);

            res.json({
                success: true,
                token,
                data: {
                    employeeId: admin.employeeId,
                    role: admin.role
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();