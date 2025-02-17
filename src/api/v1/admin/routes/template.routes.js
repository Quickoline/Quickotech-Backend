const express = require('express');
const router = express.Router();
const TemplateController = require('../controller/template.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationTemplate:
 *       type: object
 *       required:
 *         - type
 *         - title
 *         - message
 *       properties:
 *         type:
 *           type: string
 *           description: Unique identifier for the template
 *           example: orderConfirmation
 *         title:
 *           type: string
 *           description: Template title with variables in {{variableName}} format
 *           example: "Order #{{orderId}} Confirmed"
 *         message:
 *           type: string
 *           description: Template message with variables in {{variableName}} format
 *           example: "Your order #{{orderId}} has been confirmed. Total amount: ${{amount}}"
 *         description:
 *           type: string
 *           description: Template description for admin reference
 *           example: "Sent when an order is confirmed"
 *         isActive:
 *           type: boolean
 *           description: Template status
 *           default: true
 *         variables:
 *           type: array
 *           items:
 *             type: string
 *           description: Automatically extracted variable names
 *           example: ["orderId", "amount"]
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Template not found"
 */

/**
 * @swagger
 * /api/v1/admin/templates:
 *   get:
 *     tags: [Templates]
 *     summary: Get all notification templates
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of templates
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
 *                     $ref: '#/components/schemas/NotificationTemplate'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', TemplateController.getAllTemplates);

/**
 * @swagger
 * /api/v1/admin/templates/{type}:
 *   get:
 *     tags: [Templates]
 *     summary: Get a template by type
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         example: orderConfirmation
 *     responses:
 *       200:
 *         description: Template details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NotificationTemplate'
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:type', TemplateController.getTemplate);

/**
 * @swagger
 * /api/v1/admin/templates:
 *   post:
 *     tags: [Templates]
 *     summary: Create a new template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationTemplate'
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NotificationTemplate'
 *       400:
 *         description: Invalid input or template type already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', TemplateController.createTemplate);

/**
 * @swagger
 * /api/v1/admin/templates/{type}:
 *   put:
 *     tags: [Templates]
 *     summary: Update a template
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         example: orderConfirmation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationTemplate'
 *     responses:
 *       200:
 *         description: Template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NotificationTemplate'
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:type', TemplateController.updateTemplate);

/**
 * @swagger
 * /api/v1/admin/templates/{type}:
 *   delete:
 *     tags: [Templates]
 *     summary: Delete a template
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         example: orderConfirmation
 *     responses:
 *       200:
 *         description: Template deleted successfully
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
 *                   example: Template deleted successfully
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:type', TemplateController.deleteTemplate);

module.exports = router; 