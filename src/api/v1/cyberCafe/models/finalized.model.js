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

module.exports = mongoose.model('Finalized', FinalizedSchema);