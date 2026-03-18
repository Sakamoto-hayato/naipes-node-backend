import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email configuration
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Naipes Negros <noreply@naipesnegros.com>';

// Create transporter
export const emailTransporter = nodemailer.createTransporter({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

// Verify connection on startup
export async function verifyEmailConnection(): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    logger.warn('⚠ Email service not configured - EMAIL_USER and EMAIL_PASSWORD required');
    return;
  }

  try {
    await emailTransporter.verify();
    logger.info('✓ Email service connected successfully');
  } catch (error) {
    logger.error('✗ Email service connection failed:', error);
  }
}

// Send email helper
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const info = await emailTransporter.sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    logger.info(`Email sent successfully to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}:`, error);
    return false;
  }
}

// Email templates
export const emailTemplates = {
  // Welcome email
  welcome: (username: string, confirmUrl: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎮 Welcome to Naipes Negros!</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>Thank you for registering at Naipes Negros, the ultimate Truco card game platform!</p>
          <p>To get started, please confirm your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${confirmUrl}" class="button">Confirm Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${confirmUrl}</p>
          <p>You've been awarded <strong>1000 coins</strong> as a welcome bonus. Start playing now!</p>
          <p>Best regards,<br>The Naipes Negros Team</p>
        </div>
        <div class="footer">
          <p>If you didn't create this account, please ignore this email.</p>
          <p>&copy; 2026 Naipes Negros. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Email confirmation
  confirmation: (username: string, confirmUrl: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✉️ Confirm Your Email</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>Please confirm your email address to activate your Naipes Negros account.</p>
          <p style="text-align: center;">
            <a href="${confirmUrl}" class="button">Confirm Email</a>
          </p>
          <p>Or use this link:</p>
          <p style="word-break: break-all; color: #667eea;">${confirmUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Naipes Negros. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Password recovery
  passwordReset: (username: string, resetUrl: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>We received a request to reset your password for your Naipes Negros account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or use this link:</p>
          <p style="word-break: break-all; color: #f59e0b;">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2026 Naipes Negros. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Withdrawal confirmation
  withdrawalRequest: (username: string, coins: number, amount: number, paypalEmail: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #10b981; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Withdrawal Request Received</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>Your withdrawal request has been received and is being processed.</p>
          <div class="info-box">
            <h3>Withdrawal Details:</h3>
            <p><strong>Coins:</strong> ${coins.toLocaleString()}</p>
            <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            <p><strong>PayPal Email:</strong> ${paypalEmail}</p>
            <p><strong>Status:</strong> Pending Review</p>
          </div>
          <p>Your request will be reviewed within 24-48 hours. You'll receive another email once it's processed.</p>
          <p>Thank you for playing Naipes Negros!</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Naipes Negros. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

export default {
  emailTransporter,
  verifyEmailConnection,
  sendEmail,
  emailTemplates,
};
