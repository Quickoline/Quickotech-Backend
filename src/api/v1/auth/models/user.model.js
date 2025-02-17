const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Clear the existing model if it exists
if (mongoose.models.User) {
    delete mongoose.models.User;
}

// Define a new schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    whatsappNumber: {
        type: String,
        required: [true, 'WhatsApp number is required'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false
    },
    // Make these fields explicitly optional
    firstName: {
        type: String,
        required: false,
        default: null
    },
    lastName: {
        type: String,
        required: false,
        default: null
    },
    phone: {
        type: String,
        required: false,
        default: null
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true,
    strict: true,
    validateBeforeSave: true
});

// Password hashing
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Password comparison
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

// Create new model
const User = mongoose.model('User', userSchema);

module.exports = User;