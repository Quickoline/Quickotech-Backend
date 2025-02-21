const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  documentName: {
    type: String,
    required: true
  },
  s3Url: {
    type: String,
    required: false
  },
  s3Key: {
    type: String,
    required: false
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
    required: true,
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
    enum: ['pending', 'processing', 'completed', 'rejected', 'finalized'],
    default: 'pending'
  },
  trackingStatus: {
    type: String,
    enum: [
      // Initial States
      'Order Placed',
      'Payment Pending',
      'Payment Completed',
      
      // Document Processing States
      'Documents Under Review',
      'Documents Rejected',
      'Review Completed',
      'Processing Started',
      
      // Approval States
      'Pending Approval',
      'Approved',
      'Processing Started',
      
      // Cancellation States
      'Cancelled',
      
      // Completion States
      'Completed Successfully',

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
  additionalFields: [AdditionalFieldSchema],
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

// Pre-save middleware to handle status history
ReviewSchema.pre('save', function(next) {
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
  }
  next();
});

module.exports = mongoose.model('Review', ReviewSchema);