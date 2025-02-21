const express = require('express');
const router = express.Router();
const BlogController = require('./controller/blog.controller');
const { verifyToken } = require('../../../middleware/auth/authMiddleware');
const { hasRole } = require('../../../middleware/auth/roleMiddleware');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

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
 *           format: binary
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           example: ["679bad7616b9289cffae4b3f"]
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["679bb17b9fdb7f7c8676cb4a"]
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
 *         author:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Super Admin"
 *             employeeId:
 *               type: string
 *               example: "SUPER001"
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Technology"
 *         description:
 *           type: string
 *           example: "Technology related posts"
 *         slug:
 *           type: string
 *           example: "technology"
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
 *           example: "Node.js related content"
 *         slug:
 *           type: string
 *           example: "nodejs"
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Error message here"
 *     PrivacyPolicy:
 *       type: object
 *       required:
 *         - content
 *         - version
 *       properties:
 *         content:
 *           type: string
 *           description: The full content of the privacy policy in HTML format
 *           example: "<h1>Privacy Policy</h1><p>This privacy policy describes how we collect and use your data...</p>"
 *         version:
 *           type: string
 *           description: Version number of the privacy policy
 *           example: "1.0.0"
 *         effectiveDate:
 *           type: string
 *           format: date
 *           description: Date when this version becomes effective
 *           example: "2024-03-19"
 *         isActive:
 *           type: boolean
 *           description: Whether this version is currently active
 *           default: false
 *           example: true
 *         changelog:
 *           type: string
 *           description: Description of changes from previous version
 *           example: "Initial privacy policy version"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when this version was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 */

/**
 * @swagger
 * tags:
 *   - name: Blog Posts
 *     description: Blog post management endpoints
 *   - name: Categories
 *     description: Blog category management endpoints
 *   - name: Tags
 *     description: Blog tag management endpoints
 *   - name: Privacy Policy
 *     description: Privacy policy management endpoints
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
 *         description: Search query (searches in title and content)
 *     responses:
 *       200:
 *         description: Search results
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
 *                     $ref: '#/components/schemas/BlogPost'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', BlogController.searchPosts);

/**
 * @swagger
 * /api/v1/blog/posts:
 *   get:
 *     summary: Get all blog posts
 *     description: Retrieve a paginated list of published blog posts
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default: 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page (default: 10)
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
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogPost'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of posts
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       description: Total number of pages
 *                       example: 5
 *       400:
 *         description: Bad request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/posts', BlogController.getAllPosts);

/**
 * @swagger
 * /api/v1/blog/posts:
 *   post:
 *     summary: Create a new blog post
 *     description: Create a new blog post with optional featured image, categories, and tags. Requires web_admin role.
 *     tags: [Blog Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the blog post
 *                 example: "How to implement Swagger in Node.js"
 *               content:
 *                 type: string
 *                 description: Main content of the blog post
 *                 example: "This is the main content of the blog post..."
 *               featured_image:
 *                 type: string
 *                 format: binary
 *                 description: Featured image for the blog post (max 5MB, jpg/jpeg/png/gif only)
 *               categories:
 *                 type: array
 *                 description: Array of category IDs or new category names
 *                 items:
 *                   type: string
 *                 example: ["Technology", "Web Development"]
 *               tags:
 *                 type: array
 *                 description: Array of tag IDs or new tag names
 *                 items:
 *                   type: string
 *                 example: ["nodejs", "swagger", "api"]
 *               published:
 *                 type: boolean
 *                 description: Whether to publish the post immediately
 *                 default: false
 *               meta:
 *                 type: object
 *                 description: Meta information for SEO
 *                 properties:
 *                   description:
 *                     type: string
 *                     description: Meta description for SEO
 *                     example: "Learn how to implement Swagger in your Node.js application"
 *                   keywords:
 *                     type: array
 *                     description: Meta keywords for SEO
 *                     items:
 *                       type: string
 *                     example: ["swagger", "nodejs", "api documentation"]
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BlogPost'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient privileges (requires web_admin role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       413:
 *         description: Payload Too Large - Image file size exceeds 5MB limit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       415:
 *         description: Unsupported Media Type - Invalid image format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/posts', verifyToken, hasRole('web_admin'), upload.single('featured_image'), BlogController.createPost);

/**
 * @swagger
 * /api/v1/blog/posts/{id}:
 *   get:
 *     summary: Get a single blog post
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BlogPost'
 *       404:
 *         description: Post not found
 *   put:
 *     summary: Update a blog post
 *     tags: [Blog Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               featured_image:
 *                 type: string
 *                 format: binary
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               published:
 *                 type: boolean
 *               meta:
 *                 type: object
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Blog Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 */
router.get('/posts/:id', BlogController.getPost);
router.put('/posts/:id', verifyToken, hasRole('web_admin'), upload.single('featured_image'), BlogController.updatePost);
router.delete('/posts/:id', verifyToken, hasRole('web_admin'), BlogController.deletePost);

/**
 * @swagger
 * /api/v1/blog/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
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
 *                     $ref: '#/components/schemas/Category'
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/categories', BlogController.createCategory);

/**
 * @swagger
 * /api/v1/blog/categories/{categoryId}:
 *   get:
 *     summary: Get a single category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
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
 *                   example: "Category deleted successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 */
router.get('/categories/:categoryId', BlogController.getCategory);
router.put('/categories/:categoryId', BlogController.updateCategory);
router.delete('/categories/:categoryId', BlogController.deleteCategory);

/**
 * @swagger
 * /api/v1/blog/tags:
 *   get:
 *     summary: Get all tags
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: List of tags
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
 *                     $ref: '#/components/schemas/Tag'
 *   post:
 *     summary: Create a new tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       201:
 *         description: Tag created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/tags', BlogController.createTag);

/**
 * @swagger
 * /api/v1/blog/tags/{tagId}:
 *   get:
 *     summary: Get a single tag
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tag details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       404:
 *         description: Tag not found
 *   put:
 *     summary: Update a tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       200:
 *         description: Tag updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tag not found
 *   delete:
 *     summary: Delete a tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tag deleted successfully
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
 *                   example: "Tag deleted successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tag not found
 */
router.get('/tags/:tagId', BlogController.getTag);
router.put('/tags/:tagId', BlogController.updateTag);
router.delete('/tags/:tagId', BlogController.deleteTag);

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
router.post('/admin/categories', BlogController.createCategory);
router.put('/admin/categories/:id', BlogController.updateCategory);
router.delete('/admin/categories/:id', BlogController.deleteCategory);
router.post('/admin/tags', BlogController.createTag);
router.put('/admin/tags/:tagId', BlogController.updateTag);
router.delete('/admin/tags/:tagId', BlogController.deleteTag);
router.post('/admin/pages', BlogController.createPage);
router.put('/admin/pages/:pageId', BlogController.updatePage);
router.delete('/admin/pages/:pageId', BlogController.deletePage);

/**
 * @swagger
 * /api/v1/blog/privacy-policy:
 *   get:
 *     summary: Get current privacy policy
 *     description: Retrieve the currently active version of the privacy policy
 *     tags: [Privacy Policy]
 *     responses:
 *       200:
 *         description: Current privacy policy retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PrivacyPolicy'
 *       404:
 *         description: No active privacy policy found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create new privacy policy version
 *     description: Create a new version of the privacy policy (requires web_admin role)
 *     tags: [Privacy Policy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - version
 *             properties:
 *               content:
 *                 type: string
 *                 description: The full content of the privacy policy in HTML format
 *               version:
 *                 type: string
 *                 description: Version number of the privacy policy
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *                 description: Date when this version becomes effective
 *               isActive:
 *                 type: boolean
 *                 description: Whether to make this version active immediately
 *               changelog:
 *                 type: string
 *                 description: Description of changes from previous version
 *     responses:
 *       201:
 *         description: Privacy policy version created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PrivacyPolicy'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient privileges
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/v1/blog/privacy-policy/versions:
 *   get:
 *     summary: Get all privacy policy versions
 *     description: Retrieve all versions of the privacy policy (requires web_admin role)
 *     tags: [Privacy Policy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of privacy policy versions
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
 *                     $ref: '#/components/schemas/PrivacyPolicy'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Insufficient privileges
 *
 * /api/v1/blog/privacy-policy/{version}:
 *   get:
 *     summary: Get specific privacy policy version
 *     description: Retrieve a specific version of the privacy policy
 *     tags: [Privacy Policy]
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *         description: Version number of the privacy policy
 *         example: "1.0.0"
 *     responses:
 *       200:
 *         description: Privacy policy version retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PrivacyPolicy'
 *       404:
 *         description: Version not found
 *   put:
 *     summary: Update privacy policy version
 *     description: Update a specific version of the privacy policy (requires web_admin role)
 *     tags: [Privacy Policy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *         description: Version number of the privacy policy to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The updated content of the privacy policy
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *               changelog:
 *                 type: string
 *     responses:
 *       200:
 *         description: Privacy policy updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PrivacyPolicy'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Version not found
 *   delete:
 *     summary: Delete privacy policy version
 *     description: Delete a specific version of the privacy policy (requires web_admin role)
 *     tags: [Privacy Policy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *         description: Version number of the privacy policy to delete
 *     responses:
 *       200:
 *         description: Privacy policy version deleted successfully
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
 *                   example: "Privacy policy version deleted successfully"
 *       400:
 *         description: Cannot delete active version
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Version not found
 */
router.get('/privacy-policy', BlogController.getCurrentPrivacyPolicy);
router.get('/privacy-policy/versions', verifyToken, hasRole('web_admin'), BlogController.getAllPrivacyPolicyVersions);
router.get('/privacy-policy/:version', BlogController.getPrivacyPolicyVersion);
router.post('/privacy-policy', verifyToken, hasRole('web_admin'), BlogController.createPrivacyPolicy);
router.put('/privacy-policy/:version', verifyToken, hasRole('web_admin'), BlogController.updatePrivacyPolicy);
router.delete('/privacy-policy/:version', verifyToken, hasRole('web_admin'), BlogController.deletePrivacyPolicy);

module.exports = router;