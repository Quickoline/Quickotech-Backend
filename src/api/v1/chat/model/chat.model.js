const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: String,
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  message: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  fileType: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days in seconds
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
ChatMessageSchema.index({ orderId: 1, createdAt: -1 });
ChatMessageSchema.index({ room: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);