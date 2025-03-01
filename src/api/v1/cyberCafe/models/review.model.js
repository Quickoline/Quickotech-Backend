const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  documentName: {
    type: String,
    required: true
  },
  p2pHash: {
    type: String,
    required: false
  },
  p2pUrl: {
    type: String,
    required: false
  },
  ocrData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  fileUploaded: {
    type: Boolean,
    default: false
  }
});

// Schema for additional fields
const AdditionalFieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true
  },
  fieldValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  fieldType: {
    type: String,
    default: 'text',
    enum: ['text', 'number', 'date', 'select', 'boolean']
  }
}, { _id: false });

const ReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  documents: [DocumentSchema],
  orderIdentifier: {
    type: String,
    default: ''
  },
  selectorField: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: [
      'pending',
      'processing',
      'completed',
      'rejected',
      'finalized',
      'cancelled',
      'approved',
      'payment_pending',
      'payment_completed'
    ],
    default: 'pending'
  },
  trackingStatus: {
    type: String,
    enum: [
      'Order Placed',
      'Payment Pending',
      'Payment Completed',
      'Documents Under Review',
      'Documents Rejected',
      'Review Completed',
      'Processing Started',
      'Pending Approval',
      'Approved',
      'Cancelled',
      'Completed Successfully'
    ],
    default: 'Order Placed'
  },
  chatStatus: {
    type: String,
    enum: ['Enabled', 'Disabled'],
    default: 'Enabled'
  },
  approveStatus: {
    type: String,
    enum: ['Enabled', 'Disabled'],
    default: 'Disabled'
  },
  additionalFields: {
    type: [AdditionalFieldSchema],
    default: [],
    validate: {
      validator: function(fields) {
        // Ensure no duplicate field names
        const fieldNames = fields.map(f => f.fieldName);
        return fieldNames.length === new Set(fieldNames).size;
      },
      message: 'Duplicate field names are not allowed'
    }
  },
  statusHistory: [{
    status: String,
    trackingStatus: String,
    chatStatus: String,
    approveStatus: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Pre-save middleware to handle status history and data clearing
ReviewSchema.pre('save', function(next) {
  // Handle status history
  if (this.isModified('chatStatus') || this.isModified('approveStatus') || 
      this.isModified('status') || this.isModified('trackingStatus')) {
    
    this.statusHistory.push({
      status: this.status,
      trackingStatus: this.trackingStatus,
      chatStatus: this.chatStatus,
      approveStatus: this.approveStatus,
      updatedBy: this.updatedBy || this.userId,
      updatedAt: new Date()
    });

    // Clear OCR data and additional fields when order is completed or cancelled
    if (this.status === 'completed' || this.status === 'cancelled') {
      // Clear OCR data
      if (this.documents && this.documents.length > 0) {
        this.documents.forEach(doc => {
          doc.ocrData = {};
        });
      }
      // Clear additional fields
      this.additionalFields = [];
    }
  }

  // Process additional fields if they are being modified or if this is a new document
  if (this.isModified('additionalFields') || this.isNew) {
    try {
      // If additionalFields is a string (JSON), parse it
      if (typeof this.additionalFields === 'string') {
        try {
          this.additionalFields = JSON.parse(this.additionalFields);
        } catch (e) {
          console.error('Failed to parse additionalFields string:', e);
        }
      }

      // Handle object format from Flutter app
      if (this.additionalFields && typeof this.additionalFields === 'object' && !Array.isArray(this.additionalFields)) {
        const formattedFields = [];
        for (const [key, value] of Object.entries(this.additionalFields)) {
          formattedFields.push({
            fieldName: key,
            fieldValue: value,
            fieldType: typeof value === 'number' ? 'number' : 'text'
          });
        }
        this.additionalFields = formattedFields;
      }

      // Ensure additionalFields is always an array
      if (!Array.isArray(this.additionalFields)) {
        this.additionalFields = [];
      }

      // Validate and format each field
      this.additionalFields = this.additionalFields.map(field => {
        // Handle case where field might be a plain object
        if (field && typeof field === 'object') {
          return {
            fieldName: field.fieldName || '',
            fieldValue: field.fieldValue || '',
            fieldType: field.fieldType || 'text'
          };
        }
        return field;
      }).filter(field => field && field.fieldName && field.fieldValue); // Remove any invalid fields
    } catch (error) {
      console.error('Error processing additional fields:', error);
      this.additionalFields = [];
    }
  }

  next();
});

// Add a method to properly format additional fields
ReviewSchema.methods.formatAdditionalFields = function() {
  if (typeof this.additionalFields === 'string') {
    try {
      return JSON.parse(this.additionalFields);
    } catch (e) {
      return [];
    }
  }
  return this.additionalFields;
};

module.exports = mongoose.model('Review', ReviewSchema);