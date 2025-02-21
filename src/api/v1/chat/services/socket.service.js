const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../../../../middleware/error/errorTypes');
const WebSocket = require('ws');
const Chat = require('../model/chat.model');
const User = require('../../user/model/user.model');

class SocketService {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New client connected');

      socket.on('join', (data) => {
        socket.join(data.room);
        console.log(`Client joined room: ${data.room}`);
      });

      socket.on('leave', (data) => {
        socket.leave(data.room);
        console.log(`Client left room: ${data.room}`);
      });

      socket.on('message', async (data) => {
        try {
          // Handle file if present
          if (data.file) {
            // Store file hash/URL from P2P network
            data.fileUrl = data.file.hash || data.file.url;
            data.fileName = data.file.name;
            data.fileType = data.file.type;
          }

          // Create chat message
          const chat = new Chat({
            room: data.room,
            sender: data.sender,
            message: data.message,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileType: data.fileType
          });

          await chat.save();

          // Broadcast to room
          this.io.to(data.room).emit('message', chat);
        } catch (error) {
          console.error('Error handling message:', error);
          socket.emit('error', { message: 'Error processing message' });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  async validateFile(file) {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = {
      // Images
      'image/jpeg': true,
      'image/png': true,
      'image/gif': true,
      'image/webp': true,
      // Documents
      'application/pdf': true,
      'application/msword': true,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
      'application/vnd.ms-excel': true,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
      // Text
      'text/plain': true,
      'text/csv': true
    };

    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.data) {
      throw new Error('No file data provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }

    const fileType = file.type || this.getFileTypeFromBase64(file.data);
    if (!fileType || !ALLOWED_TYPES[fileType]) {
      throw new Error(`File type "${fileType}" not allowed`);
    }

    return true;
  }

  getFileTypeFromBase64(base64String) {
    try {
      const match = base64String.match(/^data:([^;]+);base64,/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting file type from base64:', error);
      return null;
    }
  }

  getMessageType(fileType) {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType === 'application/pdf') return 'pdf';
    if (fileType.includes('word')) return 'document';
    if (fileType.includes('excel')) return 'spreadsheet';
    return 'file';
  }

  broadcast(orderId, message) {
    this.clients.forEach((client, ws) => {
      if (client.orderId === orderId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  sendError(ws, error) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error
      }));
    }
  }
}

module.exports = SocketService;