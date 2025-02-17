const ChatService = require('../services/chat.service');
const { NotFoundError } = require('../../../../middleware/error/errorTypes');
const ChatMessage = require('../model/chat.model');
const { uploadToS3 } = require('../../../../config/aws');
const mongoose = require('mongoose');

class ChatController {
    async getChatHistory(req, res, next) {
        try {
            const { orderId } = req.params;
            const messages = await ChatService.getChatHistory(orderId);
            res.json({ success: true, data: messages });
        } catch (error) {
            next(error);
        }
    }

    async getMessages(req, res, next) {
        try {
            const messages = await ChatService.getMessages();
            res.json({ success: true, data: messages });
        } catch (error) {
            next(error);
        }
    }

    async getMyMessages(req, res, next) {
        try {
            const messages = await ChatService.getUserMessages(req.user.id);
            res.json({ success: true, data: messages });
        } catch (error) {
            next(error);
        }
    }

    async sendMessage(req, res, next) {
        try {
            const { orderId, content } = req.body;
            const message = await ChatService.sendAdminMessage(orderId, content, req.user.id);
            res.json({ success: true, data: message });
        } catch (error) {
            next(error);
        }
    }

    async deleteMessage(req, res, next) {
        try {
            const { id } = req.params;
            await ChatService.deleteMessage(id);
            res.json({ success: true, message: 'Message deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    async getActiveUsers(req, res, next) {
        try {
            const activeUsers = await ChatService.getActiveUsers();
            res.json({ success: true, data: activeUsers });
        } catch (error) {
            next(error);
        }
    }

    async uploadFile(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file provided'
                });
            }

            const { orderId } = req.params;
            const message = req.body.message || req.file.originalname;

            // Validate orderId
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid order ID'
                });
            }

            // Determine file type and message type
            let messageType = 'file';
            if (req.file.mimetype.startsWith('image/')) {
                messageType = 'image';
            } else if (req.file.mimetype === 'application/pdf' || 
                     (req.file.mimetype === 'application/octet-stream' && 
                      req.file.originalname.toLowerCase().endsWith('.pdf'))) {
                messageType = 'pdf';
            }

            // Upload file to S3
            const uploadResult = await uploadToS3({
                buffer: req.file.buffer,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype
            });

            // Create chat message
            const chatMessage = new ChatMessage({
                orderId,
                sender: req.user.id,
                senderType: req.user.role.includes('app_admin') ? 'admin' : 'user',
                messageType,
                content: message,
                fileUrl: uploadResult.url,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            });

            await chatMessage.save();

            res.status(200).json({
                success: true,
                data: chatMessage
            });

        } catch (error) {
            console.error('File upload error:', error);
            res.status(error.status || 500).json({
                success: false,
                error: error.message || 'Error uploading file'
            });
        }
    }
}

module.exports = new ChatController();