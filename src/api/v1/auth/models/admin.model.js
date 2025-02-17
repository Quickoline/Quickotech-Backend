const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        required: true,
        enum: ['app_admin', 'web_admin', 'senior_admin', 'super_admin']
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        sparse: true, // This allows null values and maintains uniqueness for non-null values
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Add pre-save hook for password hashing
adminSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Add comparePassword method to the schema
adminSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        // Use bcrypt to compare the provided password with the hashed password
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

// Drop existing indexes to clean up any problematic ones
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
Admin.collection.dropIndexes().catch(err => console.log('No indexes to drop'));

module.exports = Admin;