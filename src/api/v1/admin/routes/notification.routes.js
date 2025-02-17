const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notification.controller');
const { verifyToken } = require('../../../../middleware/auth/authMiddleware');
const { hasRole } = require('../../../../middleware/auth/roleMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     DeviceToken:
 *       type: object
 *       required:
 *         - userId
 *         - deviceToken
 *       properties:
 *         userId:
 *           type: string
 *         deviceToken:
 *           type: string
 *     Notification:
 *       type: object
 *       required:
 *         - userId
 *         - notificationType
 *       properties:
 *         userId:
 *           type: string
 *         notificationType:
 *           type: string
 *           enum: [welcome, orderConfirmation, custom]
 *         userData:
 *           type: object
 *         isCustom:
 *           type: boolean
 *         customMessage:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             body:
 *               type: string
 *             data:
 *               type: object
 *     WebSocketMessage:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [text, image, file]
 *         content:
 *           type: string
 *         file:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             type:
 *               type: string
 *             size:
 *               type: number
 *             data:
 *               type: string
 *               format: binary
 */

// Protected routes
router.use(verifyToken);

// Admin only routes
router.use(hasRole('app_admin'));

// Get all notifications
router.get('/', (req, res, next) => {
    try {
        notificationController.getAllNotifications(req, res);
    } catch (error) {
        next(error);
    }
});

// Create new notification
router.post('/', (req, res, next) => {
    try {
        notificationController.createNotification(req, res);
    } catch (error) {
        next(error);
    }
});

// Update notification
router.put('/:id', (req, res, next) => {
    try {
        notificationController.updateNotification(req, res);
    } catch (error) {
        next(error);
    }
});

// Delete notification
router.delete('/:id', (req, res, next) => {
    try {
        notificationController.deleteNotification(req, res);
    } catch (error) {
        next(error);
    }
});

// Send notification
router.post('/send/:id', (req, res, next) => {
    try {
        notificationController.sendNotification(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/notifications/register-token:
 *   post:
 *     tags: [Notifications]
 *     summary: Register a device token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeviceToken'
 *     responses:
 *       200:
 *         description: Token registered successfully
 *       400:
 *         description: Invalid input
 */
router.post('/register-token', (req, res, next) => {
    try {
        notificationController.registerDeviceToken(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/notifications/templates:
 *   post:
 *     tags: [Notifications]
 *     summary: Create a new notification template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       200:
 *         description: Notification template created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/templates', (req, res, next) => {
    try {
        notificationController.createTemplate(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/notifications/templates/:id:
 *   put:
 *     tags: [Notifications]
 *     summary: Update a notification template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       200:
 *         description: Notification template updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Notification template not found
 */
router.put('/templates/:id', (req, res, next) => {
    try {
        notificationController.updateTemplate(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/notifications/templates/:id:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification template
 *     responses:
 *       200:
 *         description: Notification template deleted successfully
 *       404:
 *         description: Notification template not found
 */
router.delete('/templates/:id', (req, res, next) => {
    try {
        notificationController.deleteTemplate(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /ws:
 *   get:
 *     summary: WebSocket connection endpoint
 *     tags: [WebSocket]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *     responses:
 *       101:
 *         description: Switching protocols to WebSocket
 */

module.exports = router; 