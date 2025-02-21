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

    async sendEmail(to, subject, html) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject,
                html
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    async sendPasswordResetEmail(to, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const subject = 'Password Reset Request';
        const html = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
        `;

        return this.sendEmail(to, subject, html);
    }

    async sendWelcomeEmail(to, name) {
        const subject = 'Welcome to Quickotech';
        const html = `
            <h1>Welcome to Quickotech!</h1>
            <p>Dear ${name},</p>
            <p>Thank you for joining Quickotech. We're excited to have you on board!</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
        `;

        return this.sendEmail(to, subject, html);
    }
}

module.exports = new EmailService(); 