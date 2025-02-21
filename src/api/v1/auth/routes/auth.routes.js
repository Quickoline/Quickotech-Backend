const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { verifyToken, isSuperAdmin } = require('../../../../middleware/auth/authMiddleware');
const { hasMinRole } = require('../../../../middleware/auth/roleMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserSignup:
 *       type: object
 *       required:
 *         - email
 *         - whatsappNumber
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *           description: User's email address
 *         whatsappNumber:
 *           type: string
 *           example: "+919876543210"
 *           description: User's WhatsApp number with country code
 *         password:
 *           type: string
 *           format: password
 *           example: "StrongP@ss123"
 *           description: Password (min 8 characters, must include numbers and special characters)
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "StrongP@ss123"
 *     AdminLogin:
 *       type: object
 *       required:
 *         - employeeId
 *         - password
 *       properties:
 *         employeeId:
 *           type: string
 *           example: "EMP123"
 *           description: Unique employee identifier
 *         password:
 *           type: string
 *           format: password
 *           example: "AdminP@ss123"
 *           description: Admin account password
 *     CreateAdmin:
 *       type: object
 *       required:
 *         - employeeId
 *         - password
 *         - role
 *         - name
 *       properties:
 *         employeeId:
 *           type: string
 *           example: "EMP123"
 *           description: Unique employee identifier
 *         password:
 *           type: string
 *           format: password
 *           example: "AdminP@ss123"
 *           description: Strong password for admin account
 *         role:
 *           type: string
 *           enum: [app_admin, web_admin, senior_admin, super_admin]
 *           example: "web_admin"
 *           description: Admin role level
 *         name:
 *           type: string
 *           example: "John Doe"
 *           description: Admin's full name
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "507f1f77bcf86cd799439011"
 *             email:
 *               type: string
 *               example: "user@example.com"
 *             role:
 *               type: string
 *               example: "user"
 *     AdminAuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         data:
 *           type: object
 *           properties:
 *             employeeId:
 *               type: string
 *               example: "EMP123"
 *             name:
 *               type: string
 *               example: "John Doe"
 *             role:
 *               type: string
 *               example: "web_admin"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Invalid credentials"
 */

/**
 * @swagger
 * tags:
 *   - name: User Auth
 *     description: Authentication endpoints for regular users
 *   - name: Admin Auth
 *     description: Authentication endpoints for different admin roles
 *   - name: Password Management
 *     description: Password reset and recovery endpoints
 */

/**
 * @swagger
 * /api/v1/auth/user/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignup'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/user/signup', AuthController.userSignup);

/**
 * @swagger
 * /api/v1/auth/user/login:
 *   post:
 *     summary: User login with email and password
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account inactive or blocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/user/login', AuthController.userLogin);

/**
 * @swagger
 * /api/v1/auth/super-admin/login:
 *   post:
 *     summary: Super Admin Login
 *     description: Login endpoint for super administrators with highest privileges
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not a super admin account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/super-admin/login', AuthController.superAdminLogin);

/**
 * @swagger
 * /api/v1/auth/senior-admin/login:
 *   post:
 *     summary: Senior Admin Login
 *     description: Login endpoint for senior administrators
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAuthResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Insufficient privileges
 */
router.post('/senior-admin/login', AuthController.seniorAdminLogin);

/**
 * @swagger
 * /api/v1/auth/web-admin/login:
 *   post:
 *     summary: Web Admin Login
 *     description: Login endpoint for web administrators
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAuthResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Insufficient privileges
 */
router.post('/web-admin/login', AuthController.webAdminLogin);

/**
 * @swagger
 * /api/v1/auth/app-admin/login:
 *   post:
 *     summary: App Admin Login
 *     description: Login endpoint for application administrators
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAuthResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Insufficient privileges
 */
router.post('/app-admin/login', AuthController.appAdminLogin);

/**
 * @swagger
 * /api/v1/auth/admin/create:
 *   post:
 *     summary: Create new admin account
 *     description: Create a new admin account (Super Admin access required)
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAdmin'
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAuthResponse'
 *       400:
 *         description: Invalid input or validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Super admin access required
 *       409:
 *         description: Employee ID already exists
 */
router.post('/admin/create', verifyToken, isSuperAdmin, AuthController.createAdmin);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset link to user's email
 *     tags: [Password Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset instructions sent to your email"
 *       404:
 *         description: Email not found
 */
router.post('/forgot-password', AuthController.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset password using the token received via email
 *     tags: [Password Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: "reset-token-xyz..."
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "NewStrongP@ss123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 */
router.post('/reset-password', AuthController.resetPassword);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh JWT token
 *     description: Get a new access token using a valid refresh token
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: New token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', AuthController.refreshToken);

module.exports = router;