const mongoose = require('mongoose');

const FinalizedSchema = new mongoose.Schema({
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
  documents: [{
    documentName: String,
    s3Url: String,
    ocrData: mongoose.Schema.Types.Mixed
  }],
  orderIdentifier: {
    type: String,
    default: ''
  },
  selectorField: {
    type: String,
    default: ''
  },
  additionalFields: {
    type: Array,
    default: []
  },
  trackingStatus: {
    type: String,
    default: 'Approved',
    enum: ['Approved', 'Completed']
  },
  approvedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to clear OCR data and additional fields
FinalizedSchema.pre('save', function(next) {
  if (this.isNew) {
    // Clear OCR data when creating a new finalized order
    if (this.documents && this.documents.length > 0) {
      this.documents.forEach(doc => {
        doc.ocrData = {};
      });
    }
    // Clear additional fields
    this.additionalFields = [];
  }
  next();
});

module.exports = mongoose.model('Finalized', FinalizedSchema);