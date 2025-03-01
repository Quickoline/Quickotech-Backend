const express = require('express');
const router = express.Router();
const userController = require('./controllers/user.controller');
const { verifyToken } = require('../../../middleware/auth/authMiddleware');
const { hasRole } = require('../../../middleware/auth/roleMiddleware');
const { encryptResponse, decryptRequest } = require('../../../middleware/encryption/encryptionMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         street:
 *           type: string
 *           example: "123 Main Street"
 *           description: Street address including house/apartment number
 *         city:
 *           type: string
 *           example: "Mumbai"
 *           description: City name
 *         state:
 *           type: string
 *           example: "Maharashtra"
 *           description: State or province name
 *         zipCode:
 *           type: string
 *           example: "400001"
 *           description: Postal/ZIP code
 *         country:
 *           type: string
 *           example: "India"
 *           description: Country name
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
 *           example: "John"
 *           description: User's first name
 *         lastName:
 *           type: string
 *           example: "Doe"
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *           description: User's email address (must be unique)
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *           description: User's phone number with country code
 *         profilePicture:
 *           type: string
 *           format: uri
 *           example: "https://example.com/profiles/john-doe.jpg"
 *           description: URL to user's profile picture
 *         address:
 *           $ref: '#/components/schemas/Address'
 *         referCode:
 *           type: string
 *           example: "JOHN123"
 *           description: User's unique referral code
 *         referredBy:
 *           type: string
 *           example: "JANE456"
 *           description: Referral code of the user who referred this user
 *         referralRewards:
 *           type: number
 *           example: 500
 *           description: Total referral rewards earned by the user
 *         referredUsers:
 *           type: array
 *           items:
 *             type: string
 *           description: List of user IDs referred by this user
 *           example: ["user123", "user456"]
 *     Feedback:
 *       type: object
 *       required:
 *         - content
 *         - rating
 *       properties:
 *         content:
 *           type: string
 *           example: "Great service, very helpful staff!"
 *           description: Feedback content/comment
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *           description: Rating between 1-5 stars
 *     UserStats:
 *       type: object
 *       properties:
 *         totalReferrals:
 *           type: number
 *           example: 10
 *           description: Total number of successful referrals
 *         totalRewards:
 *           type: number
 *           example: 5000
 *           description: Total rewards earned through referrals
 *         totalFeedbacks:
 *           type: number
 *           example: 5
 *           description: Total number of feedbacks submitted
 *         totalContacts:
 *           type: number
 *           example: 15
 *           description: Total number of contacts added
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Invalid input data"
 *     Contact:
 *       type: object
 *       required:
 *         - name
 *         - phone
 *       properties:
 *         name:
 *           type: string
 *           example: "Rahul Kumar"
 *           description: Contact's full name
 *         phone:
 *           type: string
 *           pattern: "^\\+91[0-9]{10}$"
 *           example: "+919876543210"
 *           description: Contact's phone number with country code
 *         email:
 *           type: string
 *           format: email
 *           example: "rahul@example.com"
 *           description: Contact's email address
 *         relationship:
 *           type: string
 *           enum: [family, friend, colleague, other]
 *           example: "family"
 *           description: Relationship with the contact
 *         notes:
 *           type: string
 *           example: "Emergency contact"
 *           description: Additional notes about the contact
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and related operations
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   post:
 *     summary: Create a new user profile
 *     description: Create a new user profile with personal information, address, and optional profile picture
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *                 description: User's first name (2-50 characters)
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *                 description: User's last name (2-50 characters)
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: Valid email address (must be unique)
 *               phone:
 *                 type: string
 *                 pattern: "^\\+91[0-9]{10}$"
 *                 example: "+919876543210"
 *                 description: Indian phone number with country code (+91)
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture (max 2MB, jpg/jpeg/png only)
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "123 Main Street"
 *                   city:
 *                     type: string
 *                     example: "Mumbai"
 *                   state:
 *                     type: string
 *                     example: "Maharashtra"
 *                   zipCode:
 *                     type: string
 *                     pattern: "^[0-9]{6}$"
 *                     example: "400001"
 *                   country:
 *                     type: string
 *                     example: "India"
 *     responses:
 *       201:
 *         description: Profile created successfully
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
 *                   example: "User profile created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid phone number format. Must be +91 followed by 10 digits"
 *       409:
 *         description: Email or phone number already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Email address already registered"
 *       413:
 *         description: Profile picture too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/profile/{userId}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve detailed user profile information including address, referral details, and statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the user
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         lastLogin:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User doesn't have permission to view this profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update user profile
 *     description: Update an existing user profile information including address and profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the user to update
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               phone:
 *                 type: string
 *                 pattern: "^\\+91[0-9]{10}$"
 *                 example: "+919876543210"
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User doesn't have permission to update this profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/referral/{userId}:
 *   post:
 *     summary: Apply referral code
 *     description: Apply a referral code to earn rewards. Each user can only apply one referral code.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user applying the referral code
 *         example: "507f1f77bcf86cd799439011"
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
 *                 minLength: 6
 *                 maxLength: 10
 *                 example: "JOHN123"
 *                 description: Valid referral code of another user
 *     responses:
 *       200:
 *         description: Referral code applied successfully
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
 *                   example: "Referral code applied successfully"
 *                 rewards:
 *                   type: number
 *                   example: 100
 *                   description: Reward points earned
 *       400:
 *         description: Invalid referral code or already applied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid referral code or already used"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Referral code already applied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/feedback/{userId}:
 *   post:
 *     summary: Submit feedback
 *     description: Submit user feedback with rating and comments. Users can provide feedback on services or general experience.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user submitting feedback
 *         example: "507f1f77bcf86cd799439011"
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
 *                 minLength: 10
 *                 maxLength: 500
 *                 example: "Great service, very helpful staff!"
 *                 description: Detailed feedback comment (10-500 characters)
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *                 description: Rating between 1-5 stars
 *               category:
 *                 type: string
 *                 enum: [service, support, app, other]
 *                 example: "service"
 *                 description: Category of feedback
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
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
 *                   example: "Feedback submitted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/stats/{userId}:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve comprehensive user statistics including referrals, rewards, feedback, and activity metrics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to get statistics for
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [all, month, year]
 *         description: Time period for statistics (default is all)
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/UserStats'
 *                     - type: object
 *                       properties:
 *                         period:
 *                           type: string
 *                           example: "all"
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User doesn't have permission to view these statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/contact/{userId}:
 *   post:
 *     summary: Add a new contact
 *     description: Add a new contact to user's contact list with relationship details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user adding the contact
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Contact'
 *     responses:
 *       201:
 *         description: Contact added successfully
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
 *                   example: "Contact added successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Contact already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/contact/{userId}/{contactId}:
 *   put:
 *     summary: Update contact
 *     description: Update an existing contact's information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user who owns the contact
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the contact to update
 *         example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Contact'
 *     responses:
 *       200:
 *         description: Contact updated successfully
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
 *                   example: "Contact updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Contact not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/contact/{userId}/{contactId}:
 *   delete:
 *     summary: Delete contact
 *     description: Remove a contact from user's contact list
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user who owns the contact
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the contact to delete
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Contact deleted successfully
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
 *                   example: "Contact deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Contact not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/contacts/{userId}:
 *   get:
 *     summary: Get all contacts
 *     description: Retrieve all contacts of a user with optional filtering
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose contacts to retrieve
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: relationship
 *         schema:
 *           type: string
 *           enum: [family, friend, colleague, other]
 *         description: Filter contacts by relationship type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search contacts by name or phone number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, -name, created_at, -created_at]
 *         description: Sort contacts by field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contact'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Apply encryption middleware to all routes
router.use(encryptResponse);

// Public routes
router.post('/profile', decryptRequest, (req, res, next) => {
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

router.put('/profile/:userId', decryptRequest, (req, res, next) => {
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
router.post('/contact/:userId', decryptRequest, (req, res, next) => {
    try {
        userController.submitContact(req, res);
    } catch (error) {
        next(error);
    }
});

router.put('/contact/:userId/:contactId', decryptRequest, (req, res, next) => {
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