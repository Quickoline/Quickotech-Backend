const ChatMessage = require('../model/chat.model');
const { NotFoundError } = require('../../../../middleware/error/errorTypes');

class ChatService {
    async getMessages() {
        return await ChatMessage.find().sort({ createdAt: -1 });
    }

    async getChatHistory(orderId) {
        return await ChatMessage.find({ orderId }).sort({ createdAt: 1 });
    }

    async getUserMessages(userId) {
        return await ChatMessage.find({ 
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        }).sort({ createdAt: -1 });
    }

    async sendAdminMessage(orderId, content, adminId) {
        const message = new ChatMessage({
            orderId,
            sender: adminId,
            senderType: 'admin',
            messageType: 'text',
            content
        });
        return await message.save();
    }

    async sendUserMessage(orderId, userId, content) {
        const message = new ChatMessage({
            orderId,
            sender: userId,
            senderType: 'user',
            messageType: 'text',
            content
        });
        return await message.save();
    }

    async getActiveUsers() {
        const activeChats = await ChatMessage.aggregate([
            { 
                $sort: { createdAt: -1 } 
            },
            {
                $group: {
                    _id: '$orderId',
                    lastMessage: { $first: '$$ROOT' }
                }
            }
        ]);
        return activeChats;
    }

    async deleteMessage(messageId) {
        const message = await ChatMessage.findByIdAndDelete(messageId);
        if (!message) {
            throw new NotFoundError('Message not found');
        }
        return message;
    }

    async sendMessage(orderId, sender, senderType, content, file = null) {
        const messageData = {
            orderId,
            sender,
            senderType,
            messageType: 'text',
            content
        };

        if (file) {
            messageData.messageType = file.type.startsWith('image/') ? 'image' : 'file';
            messageData.fileUrl = file.url;
            messageData.fileName = file.name;
            messageData.fileSize = file.size;
        }

        const message = new ChatMessage(messageData);
        return await message.save();
    }
}

module.exports = new ChatService(); 