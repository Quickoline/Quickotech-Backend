const mongoose = require('mongoose');

const regexTemplateSchema = new mongoose.Schema({
    templateName: {
        type: String,
        required: [true, 'Template name is required'],
        unique: true,
        trim: true,
        index: true
    },
    deviceType: {
        type: String,
        required: [true, 'Device type is required'],
        enum: ['mobile', 'desktop', 'tablet', 'all'],
        default: 'all'
    },
    regexPatterns: [{
        fieldName: {
            type: String,
            required: true
        },
        pattern: {
            type: String,
            required: true
        },
        description: String,
        isRequired: {
            type: Boolean,
            default: false
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }
}, {
    timestamps: true
});

const RegexTemplate = mongoose.models.RegexTemplate || mongoose.model('RegexTemplate', regexTemplateSchema);

module.exports = RegexTemplate; 