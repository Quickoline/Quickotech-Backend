const express = require('express');
const router = express.Router();
const orderController = require('../controller/order.controller');
const { verifyToken } = require('../../../../middleware/auth/authMiddleware');
const { hasRole } = require('../../../../middleware/auth/roleMiddleware');
const { encryptResponse, decryptRequest, validateEncryptedRequest } = require('../../../../middleware/encryption/encryptionMiddleware');
const multer = require('multer');

// Configure multer for handling file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Maximum 10 files
    }
});

// Apply encryption middleware to all routes
router.use(encryptResponse);

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - serviceType
 *         - documents
 *       properties:
 *         serviceType:
 *           type: string
 *           enum: [print, scan, photocopy]
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               p2pHash:
 *                 type: string
 *               p2pUrl:
 *                 type: string
 *               pages:
 *                 type: number
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, cancelled]
 *         totalAmount:
 *           type: number
 *         userId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 * /api/v1/cyber-cafe/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 *   
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of orders
 *       403:
 *         description: Not authorized
 * 
 * /api/v1/cyber-cafe/orders/{orderId}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 * 
 *   put:
 *     tags: [Orders]
 *     summary: Update order status (Admin only)
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [processing, completed, cancelled]
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       403:
 *         description: Not authorized
 * 
 * /api/v1/cyber-cafe/orders/my-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get user's orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's orders
 * 
 * /api/v1/cyber-cafe/orders/{orderId}/ocr:
 *   put:
 *     summary: Update OCR data for documents in an order
 *     tags: [Orders]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     documentId:
 *                       type: string
 *                     ocrData:
 *                       type: object
 *     responses:
 *       200:
 *         description: OCR data updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Order not found
 * 
 * /api/v1/cyber-cafe/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status fields
 *     tags: [Orders]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, rejected, finalized]
 *               trackingStatus:
 *                 type: string
 *                 enum: [
 *                   Order Placed,
 *                   Payment Pending,
 *                   Payment Completed,
 *                   Documents Under Review,
 *                   Documents Rejected,
 *                   Review Completed,
 *                   Processing Started,
 *                   Pending Approval,
 *                   Approved,
 *                   Cancelled,
 *                   Completed Successfully
 *                 ]
 *               chatStatus:
 *                 type: string
 *                 enum: [Enabled, Disabled]
 *               approveStatus:
 *                 type: string
 *                 enum: [Enabled, Disabled]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Order not found
 */

// Protected routes
router.use(verifyToken);

// Create order route with file upload
router.post('/orders', validateEncryptedRequest, decryptRequest, upload.any(), (req, res) => {
    orderController.createOrder(req, res);
});

// Get all review orders - FIXED ROUTE
router.get('/orders/review', (req, res) => {
    orderController.getReviewOrders(req, res);
});

// Get all finalized orders - FIXED ROUTE
router.get('/orders/finalized', (req, res) => {
    orderController.getFinalizedOrders(req, res);
});

// Get single orders by ID
router.get('/orders/review/:orderId', (req, res) => {
    orderController.getReviewOrderById(req, res);
});

router.get('/orders/finalized/:orderId', (req, res) => {
    orderController.getFinalizedOrderById(req, res);
});

// Get my orders
router.get('/orders/my-orders', (req, res) => {
    orderController.getMyOrders(req, res);
});

// Admin routes
router.get('/orders', hasRole(['admin']), (req, res) => {
    orderController.getAllOrders(req, res);
});

// Update order status routes - accessible to both users and admins
router.patch('/orders/:orderId/status', validateEncryptedRequest, decryptRequest, (req, res) => {
    orderController.updateOrderStatus(req, res);
});

// Legacy support for PUT method
router.put('/orders/:orderId/status', validateEncryptedRequest, decryptRequest, (req, res) => {
    orderController.updateOrderStatus(req, res);
});

// Admin-only route for full order updates
router.put('/orders/:orderId', hasRole('app_admin'), validateEncryptedRequest, decryptRequest, (req, res) => {
    orderController.updateOrderStatus(req, res);
});

// Get order status history
router.get('/orders/:orderId/status-history', (req, res) => {
    orderController.getOrderStatusHistory(req, res);
});

// Custom middleware to ensure user is not admin
const ensureRegularUser = (req, res, next) => {
    if (req.user.role.includes('admin') || req.user.role.includes('app_admin')) {
        return res.status(403).json({
            success: false,
            error: 'Admins are not allowed to perform this action'
        });
    }
    next();
};

// Finalize order route - only for regular users
router.post('/orders/:orderId/finalize', ensureRegularUser, (req, res) => {
    orderController.finalizeOrder(req, res);
});

// Update OCR data route
router.put('/orders/:orderId/ocr', validateEncryptedRequest, decryptRequest, (req, res) => {
    orderController.updateOcrData(req, res);
});

module.exports = router;