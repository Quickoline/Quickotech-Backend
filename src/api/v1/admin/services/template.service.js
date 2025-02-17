const NotificationTemplate = require('../model/template.model');

class TemplateService {
    async getAllTemplates(query = {}) {
        try {
            const templates = await NotificationTemplate.find(query);
            return templates;
        } catch (error) {
            throw new Error(`Error fetching templates: ${error.message}`);
        }
    }

    async getTemplateByType(type) {
        try {
            const template = await NotificationTemplate.findOne({ type });
            if (!template) {
                throw new Error('Template not found');
            }
            return template;
        } catch (error) {
            throw new Error(`Error fetching template: ${error.message}`);
        }
    }

    async createTemplate(templateData) {
        try {
            const template = new NotificationTemplate(templateData);
            await template.save();
            return template;
        } catch (error) {
            if (error.code === 11000) {
                throw new Error('Template type already exists');
            }
            throw new Error(`Error creating template: ${error.message}`);
        }
    }

    async updateTemplate(type, updateData) {
        try {
            const template = await NotificationTemplate.findOneAndUpdate(
                { type },
                updateData,
                { new: true, runValidators: true }
            );
            if (!template) {
                throw new Error('Template not found');
            }
            return template;
        } catch (error) {
            throw new Error(`Error updating template: ${error.message}`);
        }
    }

    async deleteTemplate(type) {
        try {
            const template = await NotificationTemplate.findOneAndDelete({ type });
            if (!template) {
                throw new Error('Template not found');
            }
            return template;
        } catch (error) {
            throw new Error(`Error deleting template: ${error.message}`);
        }
    }

    async validateTemplate(templateData) {
        try {
            // Check for required fields
            if (!templateData.type || !templateData.title || !templateData.message) {
                throw new Error('Type, title, and message are required');
            }

            // Check for valid variable syntax
            const variableRegex = /\{\{(\w+)\}\}/g;
            const titleVars = [...templateData.title.matchAll(variableRegex)];
            const messageVars = [...templateData.message.matchAll(variableRegex)];

            // Extract and validate variables
            const variables = new Set([
                ...titleVars.map(match => match[1]),
                ...messageVars.map(match => match[1])
            ]);

            return Array.from(variables);
        } catch (error) {
            throw new Error(`Template validation failed: ${error.message}`);
        }
    }
}

module.exports = new TemplateService(); 