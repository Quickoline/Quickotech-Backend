const express = require('express');
const router = express.Router();
const regexTemplateController = require('../controller/regexTemplate.controller');
const { verifyToken } = require('../../../../middleware/auth/authMiddleware');
const { hasRole } = require('../../../../middleware/auth/roleMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     RegexPattern:
 *       type: object
 *       required:
 *         - fieldName
 *         - pattern
 *       properties:
 *         fieldName:
 *           type: string
 *           description: Name of the field to extract
 *         pattern:
 *           type: string
 *           description: Regex pattern for extraction
 *         description:
 *           type: string
 *           description: Description of what this pattern extracts
 *         isRequired:
 *           type: boolean
 *           description: Whether this field is required
 *           default: false
 *     
 *     RegexTemplate:
 *       type: object
 *       required:
 *         - templateName
 *         - deviceType
 *         - regexPatterns
 *       properties:
 *         templateName:
 *           type: string
 *           description: Unique name for the template
 *         deviceType:
 *           type: string
 *           enum: [mobile, desktop, tablet, all]
 *           default: all
 *         regexPatterns:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RegexPattern'
 *         isActive:
 *           type: boolean
 *           default: true
 */

/**
 * @swagger
 * tags:
 *   name: Regex Templates
 *   description: OCR Regex template management
 */

/**
 * @swagger
 * /api/v1/admin/regex-templates:
 *   get:
 *     summary: Get all templates (Public)
 *     tags: [Regex Templates]
 *     responses:
 *       200:
 *         description: List of all templates
 */
router.get('/', (req, res, next) => {
    try {
        regexTemplateController.getAllTemplates(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/regex-templates/{templateName}:
 *   get:
 *     summary: Get template by name (Public)
 *     tags: [Regex Templates]
 *     parameters:
 *       - in: path
 *         name: templateName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template found
 */
router.get('/:templateName', (req, res, next) => {
    try {
        regexTemplateController.getTemplateByName(req, res);
    } catch (error) {
        next(error);
    }
});

// Protected routes middleware - Apply after GET routes
router.use(verifyToken);
router.use(hasRole('app_admin'));

/**
 * @swagger
 * /api/v1/admin/regex-templates:
 *   post:
 *     summary: Create new regex template (Admin only)
 *     tags: [Regex Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegexTemplate'
 *     responses:
 *       201:
 *         description: Template created successfully
 */
router.post('/', (req, res, next) => {
    try {
        regexTemplateController.createTemplate(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/regex-templates/{templateName}:
 *   put:
 *     summary: Update template (Admin only)
 *     tags: [Regex Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegexTemplate'
 *     responses:
 *       200:
 *         description: Template updated successfully
 */
router.put('/:id', (req, res, next) => {
    try {
        regexTemplateController.updateTemplate(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/admin/regex-templates/{templateName}:
 *   delete:
 *     summary: Delete template (Admin only)
 *     tags: [Regex Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 */
router.delete('/:id', (req, res, next) => {
    try {
        regexTemplateController.deleteTemplate(req, res);
    } catch (error) {
        next(error);
    }
});

module.exports = router;