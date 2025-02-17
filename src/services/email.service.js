const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async sendPasswordResetEmail(email, resetToken) {
        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset</h1>
                <p>Please click the link below to reset your password. This link is valid for 1 hour.</p>
                <a href="${resetURL}">Reset Password</a>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            throw new Error('Error sending email');
        }
    }
}

module.exports = new EmailService(); 