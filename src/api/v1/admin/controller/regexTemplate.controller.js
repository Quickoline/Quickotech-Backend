const RegexTemplate = require('../model/regexTemplate.model');
const { ValidationError, NotFoundError } = require('../../../../middleware/error/errorTypes');

class RegexTemplateController {
    // Create new template
    async createTemplate(req, res, next) {
        try {
            const { templateName, deviceType, regexPatterns } = req.body;

            // Check if template already exists
            const existingTemplate = await RegexTemplate.findOne({ templateName });
            if (existingTemplate) {
                throw new ValidationError('Template with this name already exists');
            }

            const template = await RegexTemplate.create({
                templateName,
                deviceType,
                regexPatterns,
                createdBy: req.user._id
            });

            res.status(201).json({
                success: true,
                data: template
            });
        } catch (error) {
            next(error);
        }
    }

    // Get template by name
    async getTemplateByName(req, res) {
        try {
            const { templateName } = req.params;
            
            const template = await RegexTemplate.findOne({ 
                templateName: templateName,
                isActive: true 
            });

            if (!template) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            res.json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error('Error in getTemplateByName:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get all templates
    async getAllTemplates(req, res, next) {
        try {
            const templates = await RegexTemplate.find({ isActive: true });

            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            next(error);
        }
    }

    // Update template
    async updateTemplate(req, res, next) {
        try {
            const { templateName } = req.params;
            const updates = req.body;

            const template = await RegexTemplate.findOneAndUpdate(
                { templateName },
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!template) {
                throw new NotFoundError('Template not found');
            }

            res.json({
                success: true,
                data: template
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete template (soft delete)
    async deleteTemplate(req, res, next) {
        try {
            const { templateName } = req.params;

            const template = await RegexTemplate.findOneAndUpdate(
                { templateName },
                { isActive: false },
                { new: true }
            );

            if (!template) {
                throw new NotFoundError('Template not found');
            }

            res.json({
                success: true,
                message: 'Template deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RegexTemplateController();