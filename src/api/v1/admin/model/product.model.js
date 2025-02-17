const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: ['Documentation', 'Legal', 'Financial', 'Education', 'Other'],
      message: '{VALUE} is not a valid category'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  visitLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^(http|https):\/\/[^ "]+$/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  requiredDocuments: [{
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true
    },
    requiresOCR: {
      type: Boolean,
      default: false
    },
    compressionSettings: {
      maxSizeInMB: {
        type: Number,
        required: [true, 'Maximum file size is required'],
        min: [0.005, 'File size must be at least 5KB'],
        max: [25, 'File size cannot exceed 25MB'],
        default: 5
      },
      minSizeInMB: {
        type: Number,
        required: [true, 'Minimum file size is required'],
        min: [0.005, 'File size must be at least 5KB'],
        default: 0.005,  // 5KB in MB
        validate: {
          validator: function(v) {
            // Ensure minSize is less than maxSize
            return v <= this.parent.compressionSettings.maxSizeInMB;
          },
          message: 'Minimum size must be less than maximum size'
        }
      },
      preferredFormat: {
        type: String,
        enum: ['jpg', 'jpeg', 'png', 'pdf', 'any'],
        default: 'any'
      },
      quality: {
        type: Number,
        min: [1, 'Quality must be between 1 and 100'],
        max: [100, 'Quality must be between 1 and 100'],
        default: 80
      },
      allowedFormats: [{
        type: String,
        enum: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
        default: ['jpg', 'jpeg', 'png', 'pdf']
      }]
    }
  }],
  customDropdowns: [{
    label: {
      type: String,
      required: [true, 'Dropdown label is required'],
      trim: true
    },
    options: [{
      label: {
        type: String,
        required: [true, 'Option label is required'],
        trim: true
      },
      documents: [{
        type: String,
        trim: true
      }]
    }]
  }],
  applicationDetails: {
    type: Map,
    of: String,
    default: new Map()
  },
  additionalFields: {
    type: Map,
    of: {
      label: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['text', 'number', 'date', 'select', 'file'],
        required: true
      },
      required: {
        type: Boolean,
        default: false
      },
      placeholder: String,
      options: [String]
    },
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ProductSchema.index({ category: 1 });
ProductSchema.index({ title: 'text', description: 'text' });

// Update timestamp middleware
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for formatted price
ProductSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price.toFixed(2)}`;
});

// Instance method to check if product is complete
ProductSchema.methods.isComplete = function() {
  return !!(this.title && this.description && this.price && this.category);
};

// Static method to find active products by category
ProductSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

module.exports = Product;