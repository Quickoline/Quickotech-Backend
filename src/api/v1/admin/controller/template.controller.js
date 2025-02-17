const TemplateService = require('../services/template.service');

class TemplateController {
    async getAllTemplates(req, res) {
        try {
            const query = {};
            if (req.query.active !== undefined) {
                query.isActive = req.query.active === 'true';
            }
            
            const templates = await TemplateService.getAllTemplates(query);
            res.json({ success: true, data: templates });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getTemplate(req, res) {
        try {
            const template = await TemplateService.getTemplateByType(req.params.type);
            res.json({ success: true, data: template });
        } catch (error) {
            if (error.message === 'Template not found') {
                res.status(404).json({ success: false, error: error.message });
            } else {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    }

    async createTemplate(req, res) {
        try {
            // Validate template before creation
            await TemplateService.validateTemplate(req.body);
            const template = await TemplateService.createTemplate(req.body);
            res.status(201).json({ success: true, data: template });
        } catch (error) {
            if (error.message.includes('already exists')) {
                res.status(400).json({ success: false, error: error.message });
            } else {
                res.status(400).json({ success: false, error: error.message });
            }
        }
    }

    async updateTemplate(req, res) {
        try {
            // Validate template before update
            await TemplateService.validateTemplate(req.body);
            const template = await TemplateService.updateTemplate(req.params.type, req.body);
            res.json({ success: true, data: template });
        } catch (error) {
            if (error.message === 'Template not found') {
                res.status(404).json({ success: false, error: error.message });
            } else {
                res.status(400).json({ success: false, error: error.message });
            }
        }
    }

    async deleteTemplate(req, res) {
        try {
            await TemplateService.deleteTemplate(req.params.type);
            res.json({ success: true, message: 'Template deleted successfully' });
        } catch (error) {
            if (error.message === 'Template not found') {
                res.status(404).json({ success: false, error: error.message });
            } else {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    }
}

module.exports = new TemplateController(); 