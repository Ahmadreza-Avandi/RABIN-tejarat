// Notification Service for automatic email notifications - Version 2
const gmailService = require('./gmail-api.js');
const smsService = require('./sms-service.js');
const {
    generateEmailTemplate,
    generateWelcomeEmailContent
} = require('./email-template-helper.js');

class NotificationService {
    constructor() {
        this.initialized = false;
        this.emailService = null;
        this.smsInitialized = false;
    }

    async initialize() {
        if (!this.initialized || !this.smsInitialized) {
            console.log('🔧 Initializing Notification Service...');

            // Initialize Email Service
            if (!this.initialized) {
                // Try Gmail API first
                const gmailResult = await gmailService.initializeFromEnv();
                if (gmailResult) {
                    this.emailService = gmailService;
                    this.initialized = true;
                    console.log('✅ Email Service initialized with Gmail API');
                } else {
                    // Fallback to SMTP
                    console.log('⚠️ Gmail API failed, trying SMTP fallback...');
                    try {
                        const emailService = require('./email.js');
                        const smtpResult = await emailService.initializeFromEnv();
                        if (smtpResult) {
                            this.emailService = emailService;
                            this.initialized = true;
                            console.log('✅ Email Service initialized with SMTP');
                        }
                    } catch (error) {
                        console.error('❌ SMTP fallback failed:', error);
                    }
                }
            }

            // Initialize SMS Service
            if (!this.smsInitialized) {
                try {
                    const smsResult = await smsService.initialize();
                    if (smsResult) {
                        this.smsInitialized = true;
                        console.log('✅ SMS Service initialized');
                    }
                } catch (error) {
                    console.error('❌ SMS initialization failed:', error);
                }
            }

            if (!this.initialized && !this.smsInitialized) {
                console.error('❌ Failed to initialize any notification service');
            }
        }
        return this.initialized || this.smsInitialized;
    }

    async testConnection() {
        if (!this.initialized) {
            await this.initialize();
        }

        if (this.emailService && typeof this.emailService.testConnection === 'function') {
            return await this.emailService.testConnection();
        }

        return false;
    }

    // 1. ایمیل خوش‌آمدگویی برای ورود به سیستم
    async sendWelcomeEmail(userEmail, userName) {
        try {
            await this.initialize();

            const subject = '🎉 خوش آمدید!';
            const content = generateWelcomeEmailContent(userName, userEmail);
            const html = generateEmailTemplate(content, subject);

            const result = await this.emailService.sendEmail({
                to: userEmail,
                subject: subject,
                html: html
            });

            if (result.success) {
                console.log('✅ Welcome email sent to:', userEmail);
                return { success: true, messageId: result.messageId };
            } else {
                console.error('❌ Failed to send welcome email:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Welcome email error:', error);
            return { success: false, error: error.message };
        }
    }

    // 2. ایمیل اطلاع‌رسانی ثبت وظیفه
    async sendTaskAssignmentEmail(userEmail, userName, taskData) {
        try {
            await this.initialize();

            const subject = `📋 وظیفه جدید: ${taskData.title}`;
            const content = `
                <h2>وظیفه جدید برای شما ثبت شد 📋</h2>
                
                <p>سلام ${userName} عزیز،</p>
                
                <p>وظیفه جدیدی در سیستم برای شما ثبت شده است:</p>
                
                <div class="highlight-box">
                    <p><strong>📋 جزئیات وظیفه:</strong></p>
                    <p><strong>عنوان:</strong> ${taskData.title}</p>
                    <p><strong>توضیحات:</strong> ${taskData.description || 'ندارد'}</p>
                    <p><strong>اولویت:</strong> ${this.getPriorityText(taskData.priority)}</p>
                    <p><strong>دسته‌بندی:</strong> ${this.getCategoryText(taskData.category)}</p>
                    ${taskData.due_date ? `<p><strong>مهلت انجام:</strong> ${new Date(taskData.due_date).toLocaleDateString('fa-IR')}</p>` : ''}
                    <p><strong>تاریخ ثبت:</strong> ${new Date().toLocaleDateString('fa-IR')}</p>
                </div>
                
                <div class="warning-box">
                    <p><strong>💡 یادآوری:</strong> لطفاً وارد سیستم شوید و وضعیت وظیفه را به‌روزرسانی کنید.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/dashboard/tasks" class="button">
                        مشاهده وظایف
                    </a>
                </div>
                
                <p>موفق باشید! 💪</p>
            `;

            const html = generateEmailTemplate(content, subject);

            const result = await this.emailService.sendEmail({
                to: userEmail,
                subject: subject,
                html: html
            });

            if (result.success) {
                console.log('✅ Task assignment email sent to:', userEmail);
                return { success: true, messageId: result.messageId };
            } else {
                console.error('❌ Failed to send task assignment email:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Task assignment email error:', error);
            return { success: false, error: error.message };
        }
    }

    // Helper methods
    getPriorityText(priority) {
        const priorities = {
            'low': '🟢 کم',
            'medium': '🟡 متوسط',
            'high': '🔴 بالا',
            'urgent': '🚨 فوری'
        };
        return priorities[priority] || priority;
    }

    getCategoryText(category) {
        const categories = {
            'follow_up': 'پیگیری',
            'meeting': 'جلسه',
            'call': 'تماس',
            'email': 'ایمیل',
            'task': 'وظیفه',
            'other': 'سایر'
        };
        return categories[category] || category;
    }

    // 3. ارسال پیامک برای پیام جدید
    async sendNewMessageSMS(phoneNumber, userName, senderName, messageContent) {
        try {
            if (!this.smsInitialized) {
                console.log('⚠️ SMS service not initialized');
                return { success: false, error: 'SMS service not available' };
            }

            const smsText = `پیام جدید از ${senderName}:
${messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent}

برای مشاهده کامل وارد سیستم شوید.
رابین تجارت خاورمیانه`;

            const result = await smsService.sendSMS({
                to: phoneNumber,
                message: smsText
            });

            if (result.success) {
                console.log('✅ New message SMS sent to:', phoneNumber);
                return { success: true, messageId: result.messageId };
            } else {
                console.error('❌ Failed to send new message SMS:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ New message SMS error:', error);
            return { success: false, error: error.message };
        }
    }

    // 4. ارسال ایمیل برای پیام جدید
    async sendNewMessageEmail(userEmail, userName, senderName, messageContent) {
        try {
            if (!this.initialized) {
                console.log('⚠️ Email service not initialized');
                return { success: false, error: 'Email service not available' };
            }

            const subject = `💬 پیام جدید از ${senderName}`;
            const content = `
                <h2>پیام جدید دریافت کردید 💬</h2>
                
                <p>سلام ${userName} عزیز،</p>
                
                <p>پیام جدیدی از <strong>${senderName}</strong> برای شما ارسال شده است:</p>
                
                <div class="highlight-box">
                    <p><strong>💬 متن پیام:</strong></p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 10px 0; border-right: 4px solid #00BCD4;">
                        ${messageContent.length > 200 ? messageContent.substring(0, 200) + '...' : messageContent}
                    </div>
                    <p><strong>فرستنده:</strong> ${senderName}</p>
                    <p><strong>تاریخ ارسال:</strong> ${new Date().toLocaleDateString('fa-IR')}</p>
                    <p><strong>ساعت ارسال:</strong> ${new Date().toLocaleTimeString('fa-IR')}</p>
                </div>
                
                <div class="warning-box">
                    <p><strong>💡 یادآوری:</strong> لطفاً وارد سیستم شوید و به پیام پاسخ دهید.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/dashboard/chat" class="button">
                        مشاهده پیام‌ها
                    </a>
                </div>
                
                <p>موفق باشید! 💪</p>
            `;

            const html = generateEmailTemplate(content, subject);

            const result = await this.emailService.sendEmail({
                to: userEmail,
                subject: subject,
                html: html
            });

            if (result.success) {
                console.log('✅ New message email sent to:', userEmail);
                return { success: true, messageId: result.messageId };
            } else {
                console.error('❌ Failed to send new message email:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ New message email error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new NotificationService();