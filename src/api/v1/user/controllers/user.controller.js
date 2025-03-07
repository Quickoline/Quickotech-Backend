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
            const { type, description, rating } = req.body;
            
            // Validate required fields
            if (!type || !description) {
                return res.status(400).json({
                    success: false,
                    error: 'Type and description are required fields'
                });
            }

            // Validate type enum
            const validTypes = ['Service', 'Bug Report', 'Suggestion', 'Other'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    error: `Type must be one of: ${validTypes.join(', ')}`
                });
            }

            // Validate rating if provided
            if (rating !== undefined && (rating < 1 || rating > 5)) {
                return res.status(400).json({
                    success: false,
                    error: 'Rating must be between 1 and 5'
                });
            }

            const result = await UserService.submitFeedback(
                req.params.userId,
                { type, description, rating }
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
            console.log('Raw request body:', JSON.stringify(req.body, null, 2));
            let name, phone, email, notes;

            // Check if data is in encrypted format
            if (req.body.data) {
                console.log('Found data object in request body');
                ({ name, phone, email, notes } = req.body.data);
                console.log('Extracted from data:', { name, phone, email, notes });
            } else {
                console.log('Using root level request body');
                ({ name, phone, email, notes } = req.body);
                console.log('Extracted from root:', { name, phone, email, notes });
            }

            // Log values before validation
            console.log('Values before validation:', { name, phone, email, notes });

            // Validate required fields
            if (!name || !phone) {
                console.log('Validation failed - missing required fields:', { name, phone });
                return res.status(400).json({
                    success: false,
                    error: 'Name and phone are required fields'
                });
            }

            // If phone is in encrypted format, extract the value
            if (typeof phone === 'object' && phone.data) {
                console.log('Phone is in object format:', phone);
                phone = phone.data;
                console.log('Extracted phone value:', phone);
            }

            // Validate phone format (simple validation for +91 followed by 10 digits)
            const phoneRegex = /^\+91[0-9]{10}$/;
            if (!phoneRegex.test(phone)) {
                console.log('Phone validation failed:', phone);
                return res.status(400).json({
                    success: false,
                    error: 'Phone number must be in format: +91XXXXXXXXXX'
                });
            }

            // If email is in encrypted format, extract the value
            if (email && typeof email === 'object' && email.data) {
                console.log('Email is in object format:', email);
                email = email.data;
                console.log('Extracted email value:', email);
            }

            // Validate email if provided
            if (email) {
                const emailRegex = /^\S+@\S+\.\S+$/;
                if (!emailRegex.test(email)) {
                    console.log('Email validation failed:', email);
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid email format'
                    });
                }
            }

            console.log('Final data to be saved:', { name, phone, email, notes });

            const result = await UserService.submitContact(
                req.params.userId,
                { name, phone, email, notes }
            );
            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in submitContact:', error);
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