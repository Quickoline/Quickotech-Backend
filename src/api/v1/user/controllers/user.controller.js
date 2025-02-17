const UserService = require('../services/user.service');

class UserController {
    // Profile Management
    async createProfile(req, res) {
        try {
            const user = await UserService.createProfile(req.body);
            res.status(201).json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const user = await UserService.updateProfile(req.params.userId, req.body);
            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getProfile(req, res) {
        try {
            const user = await UserService.getProfile(req.params.userId);
            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    // Referral Management
    async applyReferralCode(req, res) {
        try {
            const result = await UserService.applyReferralCode(
                req.params.userId,
                req.body.referralCode
            );
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Feedback Management
    async submitFeedback(req, res) {
        try {
            const result = await UserService.submitFeedback(
                req.params.userId,
                req.body
            );
            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateFeedback(req, res) {
        try {
            const result = await UserService.updateFeedback(
                req.params.userId,
                req.params.feedbackId,
                req.body
            );
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Contact Management
    async submitContact(req, res) {
        try {
            const result = await UserService.submitContact(
                req.params.userId,
                req.body
            );
            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateContact(req, res) {
        try {
            const result = await UserService.updateContact(
                req.params.userId,
                req.params.contactId,
                req.body
            );
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get user statistics
    async getUserStats(req, res) {
        try {
            const stats = await UserService.getUserStats(req.params.userId);
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new UserController();