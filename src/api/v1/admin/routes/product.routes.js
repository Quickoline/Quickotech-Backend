const express = require('express');
const router = express.Router();
const ProductController = require('../controller/product.controller');
const { verifyToken } = require('../../../../middleware/auth/authMiddleware');
const { hasRole } = require('../../../../middleware/auth/roleMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the product
 *         description:
 *           type: string
 *           description: Product description
 *         price:
 *           type: string
 *           description: Product price
 *         category:
 *           type: string
 *           description: Product category
 *         visitLink:
 *           type: string
 *           description: Product visit link
 *         applicationDetails:
 *           type: object
 *           description: Additional application details
 *         requiredDocuments:
 *           type: array
 *           items:
 *             type: string
 *           description: List of required documents
 *         customDropdowns:
 *           type: array
 *           items:
 *             type: object
 *           description: Custom dropdown options
 *         additionalFields:
 *           type: object
 *           description: Additional fields
 */

/**
 * @swagger
 * /api/v1/admin/products:
 *   post:
 *     summary: Create a product (Senior Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient privileges
 */

// Public routes (no authentication required)
router.get('/', ProductController.getAllProducts.bind(ProductController));
router.get('/:id', ProductController.getProductById.bind(ProductController));
router.get('/search', ProductController.searchProducts.bind(ProductController));

// Protected routes below this line
router.use(verifyToken);
router.use(hasRole('senior_admin'));

// Admin routes (require authentication and senior_admin role)
router.post('/', ProductController.createProduct.bind(ProductController));
router.put('/:id', ProductController.updateProduct.bind(ProductController));
router.delete('/:id', ProductController.deleteProduct.bind(ProductController));
router.post('/bulk', ProductController.bulkCreateProducts.bind(ProductController));

/**
 * @swagger
 * /api/v1/admin/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field
 *     responses:
 *       200:
 *         description: List of products
 */

/**
 * @swagger
 * /api/v1/admin/products/bulk:
 *   post:
 *     summary: Bulk create products
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Products created successfully
 *       400:
 *         description: Invalid request
 */

module.exports = router;