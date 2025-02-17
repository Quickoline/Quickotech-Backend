const express = require('express');
const router = express.Router();
const BlogController = require('./controller/blog.controller');
const { verifyToken } = require('../../../middleware/auth/authMiddleware');
const { hasRole } = require('../../../middleware/auth/roleMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     BlogPost:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           example: "How to implement Swagger in Node.js"
 *         slug:
 *           type: string
 *           example: "how-to-implement-swagger-nodejs"
 *         content:
 *           type: string
 *           example: "This is the main content of the blog post..."
 *         featured_image:
 *           type: string
 *           example: "https://example.com/images/blog-image.jpg"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["nodejs", "swagger", "api"]
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Programming", "Web Development"]
 *         published:
 *           type: boolean
 *           example: true
 *         meta:
 *           type: object
 *           properties:
 *             description:
 *               type: string
 *               example: "Learn how to implement Swagger in your Node.js application"
 *             keywords:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["swagger", "nodejs", "api documentation"]
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Programming"
 *         description:
 *           type: string
 *           example: "Articles about programming and development"
 *         slug:
 *           type: string
 *           example: "programming"
 *     Tag:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "nodejs"
 *         description:
 *           type: string
 *           example: "Articles related to Node.js"
 *     Page:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           example: "About Us"
 *         content:
 *           type: string
 *           example: "Welcome to our blog..."
 *         slug:
 *           type: string
 *           example: "about-us"
 *         published:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * tags:
 *   - name: Blog Posts
 *     description: Blog post management
 *   - name: Categories
 *     description: Blog category management
 *   - name: Tags
 *     description: Blog tag management
 *   - name: Pages
 *     description: Static page management
 */

/**
 * @swagger
 * /api/v1/blog/search:
 *   get:
 *     summary: Search blog posts
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
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
 *         description: Search results
 */
router.get('/search', BlogController.searchPosts);

/**
 * @swagger
 * /api/v1/blog/posts:
 *   get:
 *     summary: Get all blog posts
 *     tags: [Blog Posts]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *     responses:
 *       200:
 *         description: List of blog posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogPost'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *   post:
 *     summary: Create a new blog post (Web Admin only)
 *     tags: [Blog Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlogPost'
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient privileges
 */
router.get('/posts', BlogController.getAllPosts);

/**
 * @swagger
 * /api/v1/blog/posts/{id}:
 *   get:
 *     tags: [Blog Posts]
 *     summary: Get a single blog post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post details
 *       404:
 *         description: Post not found
 */
router.get('/posts/:id', BlogController.getPost);

/**
 * @swagger
 * /api/v1/blog/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', BlogController.getAllCategories);

/**
 * @swagger
 * /api/v1/blog/categories/{categoryId}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a single category
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/categories/:categoryId', BlogController.getCategory);

/**
 * @swagger
 * /api/v1/blog/tags:
 *   get:
 *     tags: [Tags]
 *     summary: Get all tags
 *     responses:
 *       200:
 *         description: List of tags
 */
router.get('/tags', BlogController.getAllTags);

/**
 * @swagger
 * /api/v1/blog/tags/{tagId}:
 *   get:
 *     tags: [Tags]
 *     summary: Get a single tag
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tag details
 *       404:
 *         description: Tag not found
 */
router.get('/tags/:tagId', BlogController.getTag);

/**
 * @swagger
 * /api/v1/blog/pages:
 *   get:
 *     tags: [Pages]
 *     summary: Get all pages (Public)
 *     responses:
 *       200:
 *         description: List of pages
 */
router.get('/pages', BlogController.getAllPages);

/**
 * @swagger
 * /api/v1/blog/pages/{pageId}:
 *   get:
 *     tags: [Pages]
 *     summary: Get a single page (Public)
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page details
 *       404:
 *         description: Page not found
 */
router.get('/pages/:pageId', BlogController.getPage);

// Protected routes (require authentication)
router.use('/admin', verifyToken, hasRole('web_admin'));

// Admin routes
router.post('/posts', verifyToken, hasRole('web_admin'), BlogController.createPost);
router.put('/posts/:id', verifyToken, hasRole('web_admin'), BlogController.updatePost);
router.delete('/posts/:id', verifyToken, hasRole('web_admin'), BlogController.deletePost);
router.post('/admin/categories', BlogController.createCategory);
router.put('/admin/categories/:id', BlogController.updateCategory);
router.delete('/admin/categories/:id', BlogController.deleteCategory);
router.post('/admin/tags', BlogController.createTag);
router.put('/admin/tags/:tagId', BlogController.updateTag);
router.delete('/admin/tags/:tagId', BlogController.deleteTag);
router.post('/admin/pages', BlogController.createPage);
router.put('/admin/pages/:pageId', BlogController.updatePage);
router.delete('/admin/pages/:pageId', BlogController.deletePage);

module.exports = router;