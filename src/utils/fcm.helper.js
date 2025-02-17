const { admin } = require('../config/firebase.config');

class FCMHelper {
    static async sendToDevice(token, notification, data = {}) {
        try {
            const message = {
                notification,
                data,
                token
            };

            const response = await admin.messaging().send(message);
            return response;
        } catch (error) {
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                throw new Error('Invalid or expired device token');
            }
            throw error;
        }
    }

    static async sendToMultipleDevices(tokens, notification, data = {}) {
        try {
            const message = {
                notification,
                data,
                tokens
            };

            const response = await admin.messaging().sendMulticast(message);
            return {
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses
            };
        } catch (error) {
            throw new Error(`Error sending multicast message: ${error.message}`);
        }
    }

    static async sendToTopic(topic, notification, data = {}) {
        try {
            const message = {
                notification,
                data,
                topic
            };

            const response = await admin.messaging().send(message);
            return response;
        } catch (error) {
            throw new Error(`Error sending topic message: ${error.message}`);
        }
    }

    static async subscribeToTopic(tokens, topic) {
        try {
            const response = await admin.messaging().subscribeToTopic(tokens, topic);
            return response;
        } catch (error) {
            throw new Error(`Error subscribing to topic: ${error.message}`);
        }
    }

    static async unsubscribeFromTopic(tokens, topic) {
        try {
            const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
            return response;
        } catch (error) {
            throw new Error(`Error unsubscribing from topic: ${error.message}`);
        }
    }
}

module.exports = FCMHelper; 