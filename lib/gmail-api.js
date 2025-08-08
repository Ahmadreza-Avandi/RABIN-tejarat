const { google } = require('googleapis');

class GmailAPIService {
    constructor() {
        this.gmail = null;
        this.oAuth2Client = null;
        this.userEmail = '';
        this.initializeFromEnv();
    }

    async initializeFromEnv() {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        const userEmail = process.env.EMAIL_USER;

        if (clientId && clientSecret && refreshToken && userEmail) {
            return await this.configure(clientId, clientSecret, refreshToken, userEmail);
        }
        return false;
    }

    async configure(clientId, clientSecret, refreshToken, userEmail) {
        try {
            this.oAuth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                'http://localhost:8080'
            );

            this.oAuth2Client.setCredentials({
                refresh_token: refreshToken
            });

            // Test access token
            const { credentials } = await this.oAuth2Client.refreshAccessToken();
            console.log('✅ Access Token دریافت شد');

            this.gmail = google.gmail({ version: 'v1', auth: this.oAuth2Client });
            this.userEmail = userEmail;

            console.log('✅ Gmail API configured successfully');
            return true;
        } catch (error) {
            console.error('❌ Gmail API configuration failed:', error);
            return false;
        }
    }

    async testConnection() {
        if (!this.gmail) {
            return false;
        }

        try {
            // Test by getting user profile
            const profile = await this.gmail.users.getProfile({ userId: 'me' });
            console.log('✅ Gmail API connection successful');
            return true;
        } catch (error) {
            console.error('❌ Gmail API connection failed:', error);
            return false;
        }
    }

    createEmailContent(options) {
        const { to, subject, text, html, from, cc, bcc } = options;

        const emailLines = [];
        emailLines.push(`To: ${Array.isArray(to) ? to.join(', ') : to}`);

        if (from) emailLines.push(`From: ${from}`);
        else emailLines.push(`From: ${this.userEmail}`);

        if (cc) emailLines.push(`Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}`);
        if (bcc) emailLines.push(`Bcc: ${Array.isArray(bcc) ? bcc.join(', ') : bcc}`);

        // Encode subject for proper UTF-8 display
        const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
        emailLines.push(`Subject: ${encodedSubject}`);
        emailLines.push('Content-Type: text/html; charset=utf-8');
        emailLines.push('MIME-Version: 1.0');
        emailLines.push('');

        if (html) {
            emailLines.push(html);
        } else if (text) {
            emailLines.push(text.replace(/\n/g, '<br>'));
        }

        return emailLines.join('\n');
    }

    async sendEmail(options) {
        if (!this.gmail) {
            return {
                success: false,
                error: 'Gmail API not configured'
            };
        }

        try {
            const emailContent = this.createEmailContent(options);
            const encodedEmail = Buffer.from(emailContent).toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const result = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedEmail
                }
            });

            return {
                success: true,
                messageId: result.data.id
            };
        } catch (error) {
            console.error('❌ Gmail API send failed:', error);
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

            // Add delay between emails
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        return results;
    }

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

    getStatus() {
        return {
            configured: !!this.gmail,
            userEmail: this.userEmail,
            service: 'Gmail API'
        };
    }
}

// Create singleton instance
const gmailAPIService = new GmailAPIService();

module.exports = gmailAPIService;