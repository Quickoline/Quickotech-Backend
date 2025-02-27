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
 *           type: number
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
 * 
 *   parameters:
 *     searchQuery:
 *       in: query
 *       name: q
 *       schema:
 *         type: string
 *       description: Search query string
 *     category:
 *       in: query
 *       name: category
 *       schema:
 *         type: string
 *       description: Product category to filter by
 *     minPrice:
 *       in: query
 *       name: minPrice
 *       schema:
 *         type: number
 *       description: Minimum price filter
 *     maxPrice:
 *       in: query
 *       name: maxPrice
 *       schema:
 *         type: number
 *       description: Maximum price filter
 *     sortBy:
 *       in: query
 *       name: sortBy
 *       schema:
 *         type: string
 *         enum: [price_asc, price_desc, title_asc, title_desc, newest, oldest]
 *       description: Sort products by specific fields
 *     page:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *       description: Page number for pagination
 *     limit:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 10
 *       description: Number of items per page
 */

// Search routes (must be before /:id to prevent conflicts)
/**
 * @swagger
 * /api/v1/admin/products/search/all:
 *   get:
 *     summary: Search products across all categories
 *     tags: [Products]
 *     parameters:
 *       - name: keyword
 *         in: query
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - name: priceRange
 *         in: query
 *         schema:
 *           type: string
 *         description: Price range in format min-max
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *           enum: [price_low, price_high, newest, oldest]
 *         description: Sort order
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/search/all', ProductController.searchAllProducts);

/**
 * @swagger
 * /api/v1/admin/products/search/{category}:
 *   get:
 *     summary: Search products in specific category
 *     tags: [Products]
 *     parameters:
 *       - name: category
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Category to search in
 *       - name: keyword
 *         in: query
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - name: priceRange
 *         in: query
 *         schema:
 *           type: string
 *         description: Price range in format min-max
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *           enum: [price_low, price_high, newest, oldest]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/search/:category', ProductController.searchByCategory);

/**
 * @swagger
 * /api/v1/admin/products/search:
 *   get:
 *     summary: Basic product search
 *     tags: [Products]
 *     parameters:
 *       - name: q
 *         in: query
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/search', ProductController.searchProducts);

// Public routes
/**
 * @swagger
 * /api/v1/admin/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort field
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', ProductController.getAllProducts);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Product not found
 */
router.get('/:id', ProductController.getProductById);

// Protected routes
router.use(verifyToken);
router.use(hasRole('senior_admin'));

// Admin routes
/**
 * @swagger
 * /api/v1/admin/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/', ProductController.createProduct);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:id', ProductController.updateProduct);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id', ProductController.deleteProduct);

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
router.post('/bulk', ProductController.bulkCreateProducts);

module.exports = router;