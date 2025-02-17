const mongoose = require('mongoose');

// Check if model exists before defining
const NotificationTemplate = mongoose.models.NotificationTemplate || mongoose.model('NotificationTemplate', new mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    variables: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
}));

// Add pre-save hook only if it doesn't exist
if (!NotificationTemplate.schema._variables) {
    NotificationTemplate.schema.pre('save', function(next) {
        const variables = new Set();
        const regex = /\{\{(\w+)\}\}/g;
        let match;

        while ((match = regex.exec(this.title)) !== null) {
            variables.add(match[1]);
        }
        while ((match = regex.exec(this.message)) !== null) {
            variables.add(match[1]);
        }

        this.variables = Array.from(variables);
        next();
    });
    NotificationTemplate.schema._variables = true;
}

module.exports = NotificationTemplate; 