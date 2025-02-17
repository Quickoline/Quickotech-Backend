const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../../../../middleware/error/errorTypes');
const WebSocket = require('ws');
const ChatMessage = require('../model/chat.model');
const { uploadToS3 } = require('../../../../config/aws');

class SocketService {
  constructor(server) {
    // Initialize WebSocket server with the correct path
    this.wss = new WebSocket.Server({ 
      server,
      path: '/chat'  // Add this line to match the client connection path
    });
    this.clients = new Map(); // Map to store client connections
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', async (ws, req) => {
      try {
        console.log('New connection attempt');
        
        // Parse URL parameters
        const params = new URLSearchParams(req.url.split('?')[1]);
        const token = params.get('token');
        const orderId = params.get('orderId');
        const userType = params.get('userType');

        console.log('Connection params:', { orderId, userType });

        // Verify token
        if (!token) {
          throw new AuthenticationError('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified for user:', decoded.id);
        
        // Store client connection with metadata
        this.clients.set(ws, {
          orderId,
          userId: decoded.id,
          userType,
          role: decoded.role
        });

        // Send connection confirmation
        ws.send(JSON.stringify({
          type: 'connection',
          status: 'connected',
          orderId,
          userId: decoded.id,
          userType
        }));

        // Handle incoming messages
        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message.toString());
            await this.handleMessage(ws, data);
          } catch (error) {
            this.sendError(ws, error.message);
          }
        });

        // Handle client disconnection
        ws.on('close', () => {
          this.clients.delete(ws);
          console.log(`Client disconnected: ${decoded.id}`);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.sendError(ws, 'WebSocket error occurred');
        });

      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
        ws.close();
      }
    });

    // Add error handler for the server itself
    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  async handleMessage(ws, data) {
    try {
      const client = this.clients.get(ws);
      if (!client) {
        throw new Error('Client not found');
      }

      const { type, content, file } = data;
      console.log('Received message data:', { type, content, fileInfo: file ? { name: file.name, type: file.type, size: file.size } : null });

      let messageData = {
        orderId: client.orderId,
        sender: client.userId,
        senderType: client.userType,
        messageType: type || 'text',
        content: content || ''
      };

      // Handle file uploads
      if (file) {
        // Validate file first
        await this.validateFile(file);
        
        try {
          // Parse base64 data
          const base64Data = file.data.split(';base64,').pop();
          if (!base64Data) {
            throw new Error('Invalid file data format');
          }

          const fileBuffer = Buffer.from(base64Data, 'base64');
          const fileType = file.type || this.getFileTypeFromBase64(file.data);
          const fileName = `${Date.now()}-${file.name}`;

          console.log('Uploading file:', { fileName, fileType, size: fileBuffer.length });

          const uploadResult = await uploadToS3({
            buffer: fileBuffer,
            originalname: fileName,
            mimetype: fileType
          });

          messageData.fileUrl = uploadResult.url;
          messageData.fileName = file.name;
          messageData.fileSize = file.size;
          messageData.mimeType = fileType;
          messageData.messageType = this.getMessageType(fileType);

          console.log('File uploaded successfully:', uploadResult);
        } catch (error) {
          console.error('File processing error:', error);
          throw new Error(`File processing failed: ${error.message}`);
        }
      }

      // Save message to database
      const message = new ChatMessage(messageData);
      await message.save();

      // Broadcast message to all clients in the same order chat
      this.broadcast(client.orderId, {
        type: 'message',
        data: message
      });

    } catch (error) {
      console.error('Message handling error:', error);
      this.sendError(ws, error.message);
    }
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
      'application/octet-stream': true,  // Added for generic binary files
      'application/x-pdf': true,         // Alternative PDF MIME type
      'binary/octet-stream': true,       // Another binary format
      'application/msword': true,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
      'application/vnd.ms-excel': true,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
      // Text
      'text/plain': true,
      'text/csv': true,
      // Others
      'application/zip': true,
      'application/x-zip-compressed': true
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

    let fileType = file.type || this.getFileTypeFromBase64(file.data);
    console.log('Initial file type:', fileType);

    // Handle octet-stream for PDFs and other known types
    if (fileType === 'application/octet-stream') {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.pdf')) {
        fileType = 'application/pdf';
      } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        fileType = 'application/msword';
      } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
        fileType = 'application/vnd.ms-excel';
      } else if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
        fileType = `image/${fileName.split('.').pop()}`;
      }
    }

    console.log('Resolved file type:', fileType);

    if (!fileType || !ALLOWED_TYPES[fileType]) {
      const extension = file.name.split('.').pop().toLowerCase();
      console.log('File extension:', extension);
      
      // Additional extension-based validation
      if (extension === 'pdf') {
        fileType = 'application/pdf';
      } else {
        throw new Error(`File type "${fileType}" not allowed. Allowed types: ${Object.keys(ALLOWED_TYPES).join(', ')}`);
      }
    }

    // Update the file type for future processing
    file.type = fileType;
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
    // Enhanced message type detection
    if (fileType.startsWith('image/')) return 'image';
    if (fileType === 'application/pdf' || fileType === 'application/x-pdf') return 'pdf';
    if (fileType === 'application/octet-stream') {
      // Try to determine type from file extension
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.pdf')) return 'pdf';
      if (fileName.match(/\.(doc|docx)$/)) return 'document';
      if (fileName.match(/\.(xls|xlsx)$/)) return 'spreadsheet';
      if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) return 'image';
      return 'file';
    }
    if (fileType.startsWith('application/msword') || 
        fileType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml')) return 'document';
    if (fileType.startsWith('application/vnd.ms-excel') || 
        fileType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) return 'spreadsheet';
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