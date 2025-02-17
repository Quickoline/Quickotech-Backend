const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deviceToken: {
        type: String,
        required: true
    },
    deviceType: {
        type: String,
        enum: ['android', 'ios', 'web'],
        default: 'android'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastUsed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
deviceSchema.index({ userId: 1, deviceToken: 1 }, { unique: true });

// Pre-save middleware to update lastUsed
deviceSchema.pre('save', function(next) {
    this.lastUsed = new Date();
    next();
});

deviceSchema.statics.cleanupInactiveTokens = async function(daysInactive = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    
    return this.deleteMany({
        lastUsed: { $lt: cutoffDate }
    });
};

module.exports = mongoose.model('UserDevice', deviceSchema); 