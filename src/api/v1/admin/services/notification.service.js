const admin = require('firebase-admin');
const UserDevice = require('../model/device.model');
const NotificationTemplate = require('../model/template.model');
const FCMHelper = require('../../../../utils/fcm.helper');

class NotificationService {
    async registerDeviceToken(userId, deviceToken, deviceType = 'android') {
        try {
            const device = await UserDevice.findOneAndUpdate(
                { userId, deviceToken },
                { 
                    deviceType,
                    isActive: true,
                    lastUsed: new Date()
                },
                { 
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
            return device;
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error
                throw new Error('Device token already registered');
            }
            throw new Error(`Error registering device token: ${error.message}`);
        }
    }

    async getDeviceTokens(userId) {
        try {
            const devices = await UserDevice.find({
                userId,
                isActive: true
            });
            return devices.map(device => device.deviceToken);
        } catch (error) {
            throw new Error(`Error getting device tokens: ${error.message}`);
        }
    }

    async deactivateDeviceToken(userId, deviceToken) {
        try {
            await UserDevice.findOneAndUpdate(
                { userId, deviceToken },
                { isActive: false }
            );
            return true;
        } catch (error) {
            throw new Error(`Error deactivating device token: ${error.message}`);
        }
    }

    async sendNotification(userId, notificationType, userData, isCustom = false, customMessage = null) {
        try {
            const deviceTokens = await this.getDeviceTokens(userId);
            if (!deviceTokens.length) {
                throw new Error('No active device tokens found');
            }

            let notification;
            if (isCustom) {
                notification = {
                    title: customMessage.title,
                    body: customMessage.body
                };
            } else {
                const template = await NotificationTemplate.findOne({ 
                    type: notificationType,
                    isActive: true 
                });

                if (!template) {
                    throw new Error(`Template type '${notificationType}' not found or inactive`);
                }

                notification = {
                    title: this.replaceTemplateVariables(template.title, userData),
                    body: this.replaceTemplateVariables(template.message, userData)
                };
            }

            // Send to multiple devices
            const result = await FCMHelper.sendToMultipleDevices(
                deviceTokens,
                notification,
                userData // Additional data
            );

            // Handle invalid tokens
            if (result.failureCount > 0) {
                result.responses.forEach(async (response, index) => {
                    if (!response.success && 
                        (response.error.code === 'messaging/invalid-registration-token' ||
                         response.error.code === 'messaging/registration-token-not-registered')) {
                        await this.deactivateDeviceToken(userId, deviceTokens[index]);
                    }
                });
            }

            return result;
        } catch (error) {
            throw new Error(`Error sending notification: ${error.message}`);
        }
    }

    replaceTemplateVariables(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match);
    }

    async sendBatchNotifications(notifications, batchSize = 500) {
        const batches = [];
        for (let i = 0; i < notifications.length; i += batchSize) {
            batches.push(notifications.slice(i, i + batchSize));
        }
        
        const results = [];
        for (const batch of batches) {
            const result = await Promise.allSettled(
                batch.map(n => this.sendNotification(n.userId, n.type, n.data))
            );
            results.push(...result);
        }
        return results;
    }

    async retryNotification(userId, notification, attempt = 1) {
        try {
            return await this.sendNotification(userId, ...notification);
        } catch (error) {
            if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                return this.retryNotification(userId, notification, attempt + 1);
            }
            throw error;
        }
    }
}

module.exports = new NotificationService(); 