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
 *         whatsappNumber:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     AdminLogin:
 *       type: object
 *       required:
 *         - employeeId
 *         - password
 *       properties:
 *         employeeId:
 *           type: string
 *           example: "EMP123"
 *         password:
 *           type: string
 *           format: password
 *           example: "securePassword123"
 *     CreateAdmin:
 *       type: object
 *       required:
 *         - employeeId
 *         - password
 *         - role
 *       properties:
 *         employeeId:
 *           type: string
 *           example: "EMP123"
 *         password:
 *           type: string
 *           format: password
 *           example: "securePassword123"
 *         role:
 *           type: string
 *           enum: [app_admin, web_admin, senior_admin, super_admin]
 *           example: "web_admin"
 *         name:
 *           type: string
 *           example: "John Doe"
 *     AdminResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             employeeId:
 *               type: string
 *             role:
 *               type: string
 */

/**
 * @swagger
 * tags:
 *   name: Admin Auth
 *   description: Authentication endpoints for different admin roles
 */

/**
 * @swagger
 * /api/v1/auth/user/signup:
 *   post:
 *     tags: [Auth]
 *     summary: User signup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignup'
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/user/signup', AuthController.userSignup);

/**
 * @swagger
 * /api/v1/auth/user/login:
 *   post:
 *     tags: [Auth]
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/user/login', AuthController.userLogin);

/**
 * @swagger
 * /api/v1/auth/super-admin/login:
 *   post:
 *     summary: Super Admin Login
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
 *               $ref: '#/components/schemas/AdminResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/super-admin/login', AuthController.superAdminLogin);

/**
 * @swagger
 * /api/v1/auth/senior-admin/login:
 *   post:
 *     summary: Senior Admin Login
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
 *               $ref: '#/components/schemas/AdminResponse'
 */
router.post('/senior-admin/login', AuthController.seniorAdminLogin);

/**
 * @swagger
 * /api/v1/auth/web-admin/login:
 *   post:
 *     summary: Web Admin Login
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
 *               $ref: '#/components/schemas/AdminResponse'
 */
router.post('/web-admin/login', AuthController.webAdminLogin);

/**
 * @swagger
 * /api/v1/auth/app-admin/login:
 *   post:
 *     summary: App Admin Login
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
 *               $ref: '#/components/schemas/AdminResponse'
 */
router.post('/app-admin/login', AuthController.appAdminLogin);

/**
 * @swagger
 * /api/v1/auth/admin/create:
 *   post:
 *     summary: Create new admin (Super Admin only)
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
 *               $ref: '#/components/schemas/AdminResponse'
 *       403:
 *         description: Access denied. Super admin only.
 */
router.post('/admin/create', verifyToken, isSuperAdmin, AuthController.createAdmin);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset (Users only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset email sent
 */
router.post('/forgot-password', AuthController.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', AuthController.resetPassword);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: New token generated
 */
router.post('/refresh-token', AuthController.refreshToken);

module.exports = router;