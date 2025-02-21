const User = require('../model/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserService {
    // Profile Management
    async createProfile(userData) {
        try {
            if (userData.profilePicture) {
                userData.profilePicture = userData.profilePicture.hash || userData.profilePicture.url;
            }
            
            const user = new User(userData);
            await user.save();
            return user;
        } catch (error) {
            throw new Error(`Error creating profile: ${error.message}`);
        }
    }

    async updateProfile(userId, updateData) {
        try {
            if (updateData.profilePicture) {
                updateData.profilePicture = updateData.profilePicture.hash || updateData.profilePicture.url;
            }

            const user = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            throw new Error(`Error updating profile: ${error.message}`);
        }
    }

    async getProfile(userId) {
        try {
            return await User.findById(userId);
        } catch (error) {
            throw new Error(`Error fetching profile: ${error.message}`);
        }
    }

    // Referral Management
    async applyReferralCode(userId, referralCode) {
        try {
            const referrer = await User.findOne({ referCode: referralCode });
            if (!referrer) {
                throw new Error('Invalid referral code');
            }

            const user = await User.findById(userId);
            if (user.referredBy) {
                throw new Error('Referral code already applied');
            }

            // Update referrer
            await User.findByIdAndUpdate(referrer._id, {
                $inc: { referralRewards: 100 }, // Example reward amount
                $push: { referredUsers: userId }
            });

            // Update referred user
            return await User.findByIdAndUpdate(userId, {
                referredBy: referralCode,
                $inc: { referralRewards: 50 } // Example reward amount
            }, { new: true });
        } catch (error) {
            throw new Error(`Error applying referral: ${error.message}`);
        }
    }

    // Feedback Management
    async submitFeedback(userId, feedbackData) {
        try {
            return await User.findByIdAndUpdate(userId, {
                $push: { feedbacks: feedbackData }
            }, { new: true });
        } catch (error) {
            throw new Error(`Error submitting feedback: ${error.message}`);
        }
    }

    async updateFeedback(userId, feedbackId, updateData) {
        try {
            return await User.findOneAndUpdate(
                { _id: userId, 'feedbacks._id': feedbackId },
                { $set: { 'feedbacks.$': updateData } },
                { new: true }
            );
        } catch (error) {
            throw new Error(`Error updating feedback: ${error.message}`);
        }
    }

    // Contact Management
    async submitContact(userId, contactData) {
        try {
            return await User.findByIdAndUpdate(userId, {
                $push: { contacts: contactData }
            }, { new: true });
        } catch (error) {
            throw new Error(`Error submitting contact: ${error.message}`);
        }
    }

    async updateContact(userId, contactId, updateData) {
        try {
            return await User.findOneAndUpdate(
                { _id: userId, 'contacts._id': contactId },
                { $set: { 'contacts.$': updateData } },
                { new: true }
            );
        } catch (error) {
            throw new Error(`Error updating contact: ${error.message}`);
        }
    }

    // Get user statistics
    async getUserStats(userId) {
        try {
            const user = await User.findById(userId);
            return {
                totalReferrals: user.referredUsers.length,
                totalRewards: user.referralRewards,
                totalFeedbacks: user.feedbacks.length,
                totalContacts: user.contacts.length
            };
        } catch (error) {
            throw new Error(`Error fetching user stats: ${error.message}`);
        }
    }
}

module.exports = new UserService();