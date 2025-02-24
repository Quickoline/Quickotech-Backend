const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
});

const FeedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['Service', 'Bug Report', 'Suggestion', 'Other'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved'],
        default: 'Pending'
    }
}, { timestamps: true });

const ContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    notes: String,
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Closed'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
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
        enum: ['user', 'app_admin', 'web_admin', 'senior_admin', 'super_admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    profilePicture: String,
    address: AddressSchema,
    referCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    referralRewards: {
        type: Number,
        default: 0
    },
    referredUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    feedbacks: [FeedbackSchema],
    contacts: [ContactSchema],
    lastLogin: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Add pre-save middleware to generate referCode
userSchema.pre('save', async function(next) {
    try {
        // Generate referCode only if it doesn't exist
        if (!this.referCode) {
            let isUnique = false;
            let newReferCode;
            
            // Keep trying until we get a unique referCode
            while (!isUnique) {
                newReferCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
                const existingUser = await mongoose.models.User.findOne({ referCode: newReferCode });
                if (!existingUser) {
                    isUnique = true;
                }
            }
            
            this.referCode = newReferCode;
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

// Check if model exists before compiling
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;