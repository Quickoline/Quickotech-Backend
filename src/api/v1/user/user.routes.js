const express = require('express');
const router = express.Router();
const userController = require('./controllers/user.controller');
const { verifyToken } = require('../../../middleware/auth/authMiddleware');
const { hasRole } = require('../../../middleware/auth/roleMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         street:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zipCode:
 *           type: string
 *         country:
 *           type: string
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - phone
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         profilePicture:
 *           type: string
 *         address:
 *           $ref: '#/components/schemas/Address'
 *         referCode:
 *           type: string
 *         referredBy:
 *           type: string
 *         referralRewards:
 *           type: number
 *         referredUsers:
 *           type: array
 *           items:
 *             type: string
 * 
 * /api/v1/users/profile:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       400:
 *         description: Invalid input
 * 
 * /api/v1/users/profile/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       404:
 *         description: User not found
 * 
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: User not found
 * 
 * /api/v1/users/referral/{userId}:
 *   post:
 *     tags: [Users]
 *     summary: Apply referral code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referralCode
 *             properties:
 *               referralCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Referral code applied successfully
 *       400:
 *         description: Invalid referral code
 * 
 * /api/v1/users/feedback/{userId}:
 *   post:
 *     tags: [Users]
 *     summary: Submit feedback
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - rating
 *             properties:
 *               content:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 * 
 * /api/v1/users/feedback/{userId}/{feedbackId}:
 *   put:
 *     tags: [Users]
 *     summary: Update feedback
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Feedback updated successfully
 * 
 * /api/v1/users/stats/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalReferrals:
 *                   type: number
 *                 totalRewards:
 *                   type: number
 *                 totalFeedbacks:
 *                   type: number
 *                 totalContacts:
 *                   type: number
 */

// Public routes
router.post('/profile', (req, res, next) => {
    try {
        userController.createProfile(req, res);
    } catch (error) {
        next(error);
    }
});

// Protected routes
router.use(verifyToken);

// User profile routes
router.get('/profile/:userId', (req, res, next) => {
    try {
        userController.getProfile(req, res);
    } catch (error) {
        next(error);
    }
});

router.put('/profile/:userId', (req, res, next) => {
    try {
        userController.updateProfile(req, res);
    } catch (error) {
        next(error);
    }
});

// Referral routes
router.post('/referral/:userId', (req, res, next) => {
    try {
        userController.applyReferralCode(req, res);
    } catch (error) {
        next(error);
    }
});

// Feedback routes
router.post('/feedback/:userId', (req, res, next) => {
    try {
        userController.submitFeedback(req, res);
    } catch (error) {
        next(error);
    }
});

router.put('/feedback/:userId/:feedbackId', (req, res, next) => {
    try {
        userController.updateFeedback(req, res);
    } catch (error) {
        next(error);
    }
});

// Contact routes
router.post('/contact/:userId', (req, res, next) => {
    try {
        userController.submitContact(req, res);
    } catch (error) {
        next(error);
    }
});

router.put('/contact/:userId/:contactId', (req, res, next) => {
    try {
        userController.updateContact(req, res);
    } catch (error) {
        next(error);
    }
});

// Statistics route
router.get('/stats/:userId', (req, res, next) => {
    try {
        userController.getUserStats(req, res);
    } catch (error) {
        next(error);
    }
});

module.exports = router;