import nodemailer from 'nodemailer';
export declare const emailTransporter: nodemailer.Transporter<import("nodemailer/lib/smtp-transport").SentMessageInfo, import("nodemailer/lib/smtp-transport").Options>;
export declare function verifyEmailConnection(): Promise<void>;
interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare function sendEmail(options: SendEmailOptions): Promise<boolean>;
export declare const emailTemplates: {
    welcome: (username: string, confirmUrl: string) => string;
    confirmation: (username: string, confirmUrl: string) => string;
    passwordReset: (username: string, resetUrl: string) => string;
    withdrawalRequest: (username: string, coins: number, amount: number, paypalEmail: string) => string;
};
declare const _default: {
    emailTransporter: nodemailer.Transporter<import("nodemailer/lib/smtp-transport").SentMessageInfo, import("nodemailer/lib/smtp-transport").Options>;
    verifyEmailConnection: typeof verifyEmailConnection;
    sendEmail: typeof sendEmail;
    emailTemplates: {
        welcome: (username: string, confirmUrl: string) => string;
        confirmation: (username: string, confirmUrl: string) => string;
        passwordReset: (username: string, resetUrl: string) => string;
        withdrawalRequest: (username: string, coins: number, amount: number, paypalEmail: string) => string;
    };
};
export default _default;
//# sourceMappingURL=email.d.ts.map