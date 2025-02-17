const NotificationService = require('../services/notification.service');

class NotificationController {
    async registerDeviceToken(req, res) {
        try {
            const { userId, deviceToken, deviceType } = req.body;
            const device = await NotificationService.registerDeviceToken(
                userId, 
                deviceToken,
                deviceType
            );
            res.json({ 
                success: true, 
                message: 'Token registered successfully',
                data: device
            });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async sendNotification(req, res) {
        try {
            const { userId, notificationType, userData, isCustom, customMessage } = req.body;
            const result = await NotificationService.sendNotification(
                userId,
                notificationType,
                userData,
                isCustom,
                customMessage
            );
            res.json({ success: true, data: result });
        } catch (error) {
            if (error.message.includes('not found')) {
                res.status(404).json({ success: false, error: error.message });
            } else {
                res.status(400).json({ success: false, error: error.message });
            }
        }
    }
}

module.exports = new NotificationController(); 