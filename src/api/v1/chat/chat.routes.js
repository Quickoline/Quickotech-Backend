const express = require('express');
const router = express.Router();
const ChatController = require('./controller/chat.controller');
const { verifyToken } = require('../../../middleware/auth/authMiddleware');
const { hasRole } = require('../../../middleware/auth/roleMiddleware');
const path = require('path');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Only 1 file at a time
    },
    fileFilter: (req, file, cb) => {
        // Check file types
        if (file.mimetype.startsWith('image/') || 
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/octet-stream') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
        }
    }
});

// Public routes (before authentication)
router.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, './test/chat.html'));
});

// Apply authentication middleware
router.use(verifyToken);

/**
 * @swagger
 * /api/v1/chat/history/{orderId}:
 *   get:
 *     summary: Get chat history for an order
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to get chat history for
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/history/:orderId', (req, res, next) => {
    ChatController.getChatHistory(req, res, next);
});

/**
 * @swagger
 * /api/v1/chat/order/{orderId}/upload:
 *   post:
 *     summary: Upload a file to chat (Admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/order/:orderId/upload', 
    verifyToken,  // Only verify token, no role check
    upload.single('file'), 
    (req, res, next) => {
        ChatController.uploadFile(req, res, next);
    }
);


// General message routes
router.get('/my-messages', (req, res, next) => {
    ChatController.getMyMessages(req, res, next);
});

router.post('/messages', (req, res, next) => {
    ChatController.sendMessage(req, res, next);
});

// Admin routes
router.get('/messages', hasRole('app_admin'), (req, res, next) => {
    ChatController.getMessages(req, res, next);
});

router.delete('/messages/:id', hasRole('app_admin'), (req, res, next) => {
    ChatController.deleteMessage(req, res, next);
});

router.get('/active-users', hasRole('app_admin'), (req, res, next) => {
    ChatController.getActiveUsers(req, res, next);
});

module.exports = router;