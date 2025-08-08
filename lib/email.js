const nodemailer = require('nodemailer');
const { google } = require('googleapis');

class EmailService {
    constructor() {
        this.transporter = null;
        this.config = null;
        this.defaultFrom = '';
        this.initializeFromEnv();
    }

    async initializeFromEnv() {
        // Try OAuth first if available
        const hasOAuth = process.env.GOOGLE_CLIENT_ID &&
            process.env.GOOGLE_CLIENT_SECRET &&
            process.env.GOOGLE_REFRESH_TOKEN;

        if (hasOAuth) {
            const oauthSuccess = await this.initializeGmailOAuth();
            if (oauthSuccess) {
                console.log('✅ Email service initialized with Gmail OAuth');
                return true;
            }
        }

        // Fallback to SMTP
        const emailHost = process.env.EMAIL_HOST;
        const emailPort = process.env.EMAIL_PORT;
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        const emailSecure = process.env.EMAIL_SECURE === 'true';

        if (emailHost && emailPort && emailUser && emailPass) {
            this.configure({
                host: emailHost,
                port: parseInt(emailPort),
                secure: emailSecure,
                auth: {
                    user: emailUser,
                    pass: emailPass
                }
            });
            this.defaultFrom = emailUser;
            console.log('✅ Email service initialized with SMTP');
            return true;
        } else {
            console.log('⚠️ Email service not configured - missing environment variables');
            console.log('Available env vars:', {
                EMAIL_HOST: !!process.env.EMAIL_HOST,
                EMAIL_PORT: !!process.env.EMAIL_PORT,
                EMAIL_USER: !!process.env.EMAIL_USER,
                EMAIL_PASS: !!process.env.EMAIL_PASS,
                GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
                GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
                GOOGLE_REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN
            });
            return false;
        }
    }

    configure(config, defaultFrom) {
        this.config = config;
        this.defaultFrom = defaultFrom || config.auth.user;

        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: config.auth,
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // Gmail configuration
    configureGmail(email, appPassword) {
        this.configure({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: email,
                pass: appPassword
            }
        }, email);
    }

    // Gmail OAuth configuration
    async configureGmailOAuth(clientId, clientSecret, refreshToken, userEmail) {
        try {
            const oAuth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                'http://localhost:8080'
            );

            oAuth2Client.setCredentials({
                refresh_token: refreshToken
            });

            // Get access token
            const { credentials } = await oAuth2Client.refreshAccessToken();
            const accessToken = credentials.access_token;

            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: userEmail,
                    clientId: clientId,
                    clientSecret: clientSecret,
                    refreshToken: refreshToken,
                    accessToken: accessToken
                }
            });

            this.defaultFrom = userEmail;
            console.log('✅ Gmail OAuth configured successfully');
            return true;
        } catch (error) {
            console.error('❌ Gmail OAuth configuration failed:', error);
            return false;
        }
    }

    // Initialize Gmail OAuth from environment
    async initializeGmailOAuth() {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        const userEmail = process.env.EMAIL_USER;

        if (clientId && clientSecret && refreshToken && userEmail) {
            return await this.configureGmailOAuth(clientId, clientSecret, refreshToken, userEmail);
        }
        return false;
    }

    async testConnection() {
        if (!this.transporter) {
            throw new Error('Email service not configured');
        }

        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('Email connection test failed:', error);
            return false;
        }
    }

    async sendEmail(options) {
        if (!this.transporter) {
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        try {
            const mailOptions = {
                from: options.from || this.defaultFrom,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
                bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments
            };

            const result = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: result.messageId
            };
        } catch (error) {
            console.error('Email sending failed:', error);
            return {
                success: false,
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    async sendBulkEmails(emails) {
        const results = [];

        for (const email of emails) {
            const result = await this.sendEmail(email);
            results.push(result);

            // Add small delay between emails to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return results;
    }

    // Template-based email sending
    async sendTemplateEmail(to, subject, template, variables = {}) {
        let processedTemplate = template;

        // Replace variables in template
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            processedTemplate = processedTemplate.replace(regex, value);
        });

        // Convert text to HTML with basic formatting
        const htmlContent = processedTemplate
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        return this.sendEmail({
            to,
            subject,
            text: processedTemplate,
            html: this.wrapInEmailTemplate(htmlContent, subject)
        });
    }

    wrapInEmailTemplate(content, subject) {
        return `
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .email-container {
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .email-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }
                .email-header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .email-body {
                    padding: 30px 20px;
                }
                .email-footer {
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #eee;
                }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background: #667eea;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                }
                .button:hover {
                    background: #5a6fd8;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-header">
                    <h1>سیستم مدیریت ارتباط با مشتری</h1>
                </div>
                <div class="email-body">
                    ${content}
                </div>
                <div class="email-footer">
                    <p>این پیام از سیستم مدیریت ارتباط با مشتری ارسال شده است</p>
                    <p>تاریخ ارسال: ${new Date().toLocaleDateString('fa-IR')}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Get configuration status
    getStatus() {
        return {
            configured: !!this.transporter,
            defaultFrom: this.defaultFrom,
            config: this.config ? {
                host: this.config.host,
                port: this.config.port,
                secure: this.config.secure,
                user: this.config.auth.user
            } : null
        };
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;