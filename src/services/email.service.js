const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Create Gmail transporter with correct SMTP settings
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });

        // Verify connection configuration
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('Email server is ready to send messages');
        } catch (error) {
            console.error('Email service error:', error);
            // Retry connection after 5 seconds
            setTimeout(() => this.verifyConnection(), 5000);
        }
    }

    async sendEmail(to, subject, html) {
        try {
            const mailOptions = {
                from: `"Quickoline Support" <${process.env.EMAIL_FROM}>`,
                to,
                subject,
                html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    async sendPasswordResetEmail(to, resetToken) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
            const subject = 'Password Reset Request - Quickoline';
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h2 style="color: #333; margin: 0;">Password Reset Request</h2>
                    </div>
                    <div style="padding: 20px; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
                        <p style="color: #555;">You requested a password reset for your Quickoline account. Click the button below to reset your password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #4CAF50; 
                                      color: white; 
                                      padding: 12px 30px; 
                                      text-decoration: none; 
                                      border-radius: 5px; 
                                      display: inline-block;
                                      font-weight: bold;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">This link will expire in 1 hour for security reasons.</p>
                        <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.</p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                                This is an automated message from Quickoline. Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                </div>
            `;

            const result = await this.sendEmail(to, subject, html);
            console.log(`Password reset email sent to ${to}`);
            return result;
        } catch (error) {
            console.error('Password reset email failed:', error);
            throw new Error(`Failed to send password reset email: ${error.message}`);
        }
    }

    async sendWelcomeEmail(to, name) {
        try {
            const subject = 'Welcome to Quickotech!';
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h2 style="color: #333; margin: 0;">Welcome to Quickotech!</h2>
                    </div>
                    <div style="padding: 20px; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
                        <p style="color: #555;">Dear ${name},</p>
                        <p style="color: #555;">Thank you for joining Quickotech. We're excited to have you on board!</p>
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0; color: #666;">If you have any questions or need assistance, our support team is here to help.</p>
                        </div>
                        <p style="color: #555;">Best regards,<br>The Quickotech Team</p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                                This is an automated message from Quickotech. Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                </div>
            `;

            const result = await this.sendEmail(to, subject, html);
            console.log(`Welcome email sent to ${to}`);
            return result;
        } catch (error) {
            console.error('Welcome email failed:', error);
            throw new Error(`Failed to send welcome email: ${error.message}`);
        }
    }

    async sendOrderConfirmationEmail(to, orderDetails) {
        try {
            const subject = 'Order Confirmation - Quickotech';
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h2 style="color: #333; margin: 0;">Order Confirmation</h2>
                    </div>
                    <div style="padding: 20px; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
                        <p style="color: #555;">Thank you for your order!</p>
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #333;">Order Details:</h3>
                            <p style="margin: 5px 0; color: #666;">Order ID: ${orderDetails.orderId}</p>
                            <p style="margin: 5px 0; color: #666;">Status: ${orderDetails.status}</p>
                            <p style="margin: 5px 0; color: #666;">Date: ${new Date(orderDetails.createdAt).toLocaleString()}</p>
                        </div>
                        <p style="color: #555;">We'll keep you updated on your order status.</p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                                This is an automated message from Quickotech. Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                </div>
            `;

            const result = await this.sendEmail(to, subject, html);
            console.log(`Order confirmation email sent to ${to}`);
            return result;
        } catch (error) {
            console.error('Order confirmation email failed:', error);
            throw new Error(`Failed to send order confirmation email: ${error.message}`);
        }
    }
}

module.exports = new EmailService(); 