const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'pdf', 'document', 'spreadsheet'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days in seconds
  }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);