// Notification Service for automatic email notifications
const gmailService = require('./gmail-api.js');

class NotificationService {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            console.log('🔧 Initializing Notification Service...');
            const initResult = await gmailService.initializeFromEnv();
            if (initResult) {
                this.initialized = true;
                console.log('✅ Notification Service initialized');
            } else {
                console.error('❌ Failed to initialize Notification Service');
            }
        }
        return this.initialized;
    }

    // 1. ایمیل خوش‌آمدگویی برای ورود به سیستم
    async sendWelcomeEmail(userEmail, userName) {
        try {
            await this.initialize();

            const subject = '🎉 خوش آمدید به شرکت رابین تجارت خاورمیانه';
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
                    <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">🎉 خوش آمدید!</h1>
                    </div>
                    
                    <div style="background: white; padding: 30px; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333;">سلام ${userName} عزیز!</h2>
                        
                        <p>شما با موفقیت به نرم‌افزار <strong>شرکت رابین تجارت خاورمیانه</strong> وارد شدید.</p>
                        
                        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #2e7d32; margin-top: 0;">📍 اطلاعات ورود:</h3>
                            <p><strong>ایمیل:</strong> ${userEmail}</p>
                            <p><strong>تاریخ ورود:</strong> ${new Date().toLocaleDateString('fa-IR')}</p>
                            <p><strong>ساعت ورود:</strong> ${new Date().toLocaleTimeString('fa-IR')}</p>
                        </div>
                        
                        <p>از امکانات کامل سیستم استفاده کنید و در صورت نیاز به راهنمایی با تیم پشتیبانی تماس بگیرید.</p>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <p style="margin: 0;"><strong>💡 نکته امنیتی:</strong> اگر این ورود توسط شما انجام نشده، لطفاً فوراً با مدیر سیستم تماس بگیرید.</p>
                        </div>
                        
                        <p style="margin-top: 30px;">موفق باشید! 🎯</p>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            <strong>شرکت رابین تجارت خاورمیانه</strong><br>
                            سیستم مدیریت ارتباط با مشتریان
                        </p>
                    </div>
                </div>
            `;

            const result = await gmailService.sendEmail({
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

            const subject = `📋 وظیفه جدید برای شما ثبت شد: ${taskData.title}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
                    <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">📋 وظیفه جدید</h1>
                    </div>
                    
                    <div style="background: white; padding: 30px; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333;">سلام ${userName} عزیز!</h2>
                        
                        <p>وظیفه جدیدی برای شما در سیستم <strong>شرکت رابین تجارت خاورمیانه</strong> ثبت شد.</p>
                        
                        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1976d2; margin-top: 0;">📋 جزئیات وظیفه:</h3>
                            <p><strong>عنوان:</strong> ${taskData.title}</p>
                            <p><strong>توضیحات:</strong> ${taskData.description || 'ندارد'}</p>
                            <p><strong>اولویت:</strong> ${this.getPriorityText(taskData.priority)}</p>
                            <p><strong>دسته‌بندی:</strong> ${this.getCategoryText(taskData.category)}</p>
                            ${taskData.due_date ? `<p><strong>مهلت انجام:</strong> ${new Date(taskData.due_date).toLocaleDateString('fa-IR')}</p>` : ''}
                            <p><strong>تاریخ ثبت:</strong> ${new Date().toLocaleDateString('fa-IR')}</p>
                            <p><strong>ساعت ثبت:</strong> ${new Date().toLocaleTimeString('fa-IR')}</p>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <p style="margin: 0;"><strong>💡 یادآوری:</strong> لطفاً وارد سیستم شوید و وضعیت وظیفه را به‌روزرسانی کنید.</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000/dashboard/tasks" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                مشاهده وظایف
                            </a>
                        </div>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            <strong>شرکت رابین تجارت خاورمیانه</strong><br>
                            سیستم مدیریت وظایف
                        </p>
                    </div>
                </div>
            `;

            const result = await gmailService.sendEmail({
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

    // 3. ایمیل اطلاع‌رسانی ثبت فروش به مدیرعامل
    async sendSaleNotificationToCEO(saleData) {
        try {
            await this.initialize();

            // Get CEO email from environment or database
            const ceoEmail = process.env.CEO_EMAIL || 'ahmadrezaavandi@gmail.com'; // Default CEO email

            const subject = `💰 فروش جدید ثبت شد - ${this.formatCurrency(saleData.total_amount, saleData.currency)}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
                    <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">💰 فروش جدید</h1>
                    </div>
                    
                    <div style="background: white; padding: 30px; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333;">گزارش فروش جدید</h2>
                        
                        <p>فروش جدیدی در سیستم <strong>شرکت رابین تجارت خاورمیانه</strong> ثبت شد.</p>
                        
                        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #f57c00; margin-top: 0;">💰 جزئیات فروش:</h3>
                            <p><strong>مبلغ فروش:</strong> ${this.formatCurrency(saleData.total_amount, saleData.currency)}</p>
                            <p><strong>مشتری:</strong> ${saleData.customer_name}</p>
                            <p><strong>فروشنده:</strong> ${saleData.sales_person_name}</p>
                            <p><strong>وضعیت پرداخت:</strong> ${this.getPaymentStatusText(saleData.payment_status)}</p>
                            <p><strong>روش پرداخت:</strong> ${saleData.payment_method || 'نامشخص'}</p>
                            ${saleData.invoice_number ? `<p><strong>شماره فاکتور:</strong> ${saleData.invoice_number}</p>` : ''}
                            <p><strong>تاریخ ثبت:</strong> ${new Date().toLocaleDateString('fa-IR')}</p>
                            <p><strong>ساعت ثبت:</strong> ${new Date().toLocaleTimeString('fa-IR')}</p>
                        </div>
                        
                        ${saleData.notes ? `
                        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin-top: 0;">📝 یادداشت:</h4>
                            <p style="margin: 0;">${saleData.notes}</p>
                        </div>
                        ` : ''}
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000/dashboard/sales" style="background: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                مشاهده گزارش فروش
                            </a>
                        </div>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            <strong>شرکت رابین تجارت خاورمیانه</strong><br>
                            سیستم مدیریت فروش
                        </p>
                    </div>
                </div>
            `;

            const result = await gmailService.sendEmail({
                to: ceoEmail,
                subject: subject,
                html: html
            });

            if (result.success) {
                console.log('✅ Sale notification email sent to CEO:', ceoEmail);
                return { success: true, messageId: result.messageId };
            } else {
                console.error('❌ Failed to send sale notification email:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Sale notification email error:', error);
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

    getPaymentStatusText(status) {
        const statuses = {
            'pending': '⏳ در انتظار',
            'paid': '✅ پرداخت شده',
            'partial': '🔄 پرداخت جزئی',
            'overdue': '⚠️ معوق',
            'cancelled': '❌ لغو شده'
        };
        return statuses[status] || status;
    }

    // 4. ایمیل اطلاع‌رسانی ثبت فعالیت به مدیرعامل
    async sendActivityNotificationToCEO(activityData) {
        try {
            await this.initialize();

            // Get CEO email from environment or database
            const ceoEmail = process.env.CEO_EMAIL || 'ahmadrezaavandi@gmail.com'; // Default CEO email

            const subject = `📊 فعالیت جدید ثبت شد - ${activityData.employee_name}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
                    <div style="background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">📊 فعالیت جدید</h1>
                    </div>
                    
                    <div style="background: white; padding: 30px; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333;">گزارش فعالیت جدید</h2>
                        
                        <p>همکار <strong>${activityData.employee_name}</strong> فعالیت جدیدی در سیستم <strong>شرکت رابین تجارت خاورمیانه</strong> ثبت کرد.</p>
                        
                        <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #7b1fa2; margin-top: 0;">📊 جزئیات فعالیت:</h3>
                            <p><strong>نوع فعالیت:</strong> ${this.getActivityTypeText(activityData.type)}</p>
                            <p><strong>عنوان:</strong> ${activityData.title}</p>
                            <p><strong>توضیحات:</strong> ${activityData.description || 'ندارد'}</p>
                            <p><strong>همکار:</strong> ${activityData.employee_name}</p>
                            ${activityData.customer_name ? `<p><strong>مشتری:</strong> ${activityData.customer_name}</p>` : ''}
                            ${activityData.deal_title ? `<p><strong>معامله:</strong> ${activityData.deal_title}</p>` : ''}
                            <p><strong>تاریخ ثبت:</strong> ${new Date().toLocaleDateString('fa-IR')}</p>
                            <p><strong>ساعت ثبت:</strong> ${new Date().toLocaleTimeString('fa-IR')}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000/dashboard/activities" style="background: #9C27B0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                مشاهده فعالیت‌ها
                            </a>
                        </div>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            <strong>شرکت رابین تجارت خاورمیانه</strong><br>
                            سیستم مدیریت فعالیت‌ها
                        </p>
                    </div>
                </div>
            `;

            const result = await gmailService.sendEmail({
                to: ceoEmail,
                subject: subject,
                html: html
            });

            if (result.success) {
                console.log('✅ Activity notification email sent to CEO:', ceoEmail);
                return { success: true, messageId: result.messageId };
            } else {
                console.error('❌ Failed to send activity notification email:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Activity notification email error:', error);
            return { success: false, error: error.message };
        }
    }

    // 5. ایمیل اطلاع‌رسانی پیام جدید
    async sendNewMessageNotification(userEmail, userName, messageData) {
        try {
            await this.initialize();

            const subject = `💬 پیام جدید برای شما - ${messageData.sender_name}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
                    <div style="background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">💬 پیام جدید</h1>
                    </div>
                    
                    <div style="background: white; padding: 30px; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333;">سلام ${userName} عزیز!</h2>
                        
                        <p>پیام جدیدی برای شما در سیستم <strong>شرکت رابین تجارت خاورمیانه</strong> ارسال شده است.</p>
                        
                        <div style="background: #e0f2f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #00695c; margin-top: 0;">💬 جزئیات پیام:</h3>
                            <p><strong>فرستنده:</strong> ${messageData.sender_name}</p>
                            ${messageData.conversation_title ? `<p><strong>موضوع گفتگو:</strong> ${messageData.conversation_title}</p>` : ''}
                            <p><strong>متن پیام:</strong></p>
                            <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 10px 0; border-right: 4px solid #00BCD4;">
                                ${messageData.content.length > 200 ? messageData.content.substring(0, 200) + '...' : messageData.content}
                            </div>
                            <p><strong>تاریخ ارسال:</strong> ${new Date().toLocaleDateString('fa-IR')}</p>
                            <p><strong>ساعت ارسال:</strong> ${new Date().toLocaleTimeString('fa-IR')}</p>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <p style="margin: 0;"><strong>💡 یادآوری:</strong> لطفاً وارد سیستم شوید و به پیام پاسخ دهید.</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000/dashboard/chat" style="background: #00BCD4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                مشاهده پیام‌ها
                            </a>
                        </div>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            <strong>شرکت رابین تجارت خاورمیانه</strong><br>
                            سیستم پیام‌رسانی داخلی
                        </p>
                    </div>
                </div>
            `;

            const result = await gmailService.sendEmail({
                to: userEmail,
                subject: subject,
                html: html
            });

            if (result.success) {
                console.log('✅ New message notification email sent to:', userEmail);
                return { success: true, messageId: result.messageId };
            } else {
                console.error('❌ Failed to send new message notification email:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ New message notification email error:', error);
            return { success: false, error: error.message };
        }
    }

    // Helper method for activity types
    getActivityTypeText(type) {
        const types = {
            'call': '📞 تماس تلفنی',
            'meeting': '🤝 جلسه',
            'email': '📧 ایمیل',
            'note': '📝 یادداشت',
            'task': '📋 وظیفه',
            'sale': '💰 فروش',
            'follow_up': '🔄 پیگیری',
            'other': '📊 سایر'
        };
        return types[type] || type;
    }

    formatCurrency(amount, currency = 'IRR') {
        if (currency === 'IRR') {
            return `${(amount / 1000000).toLocaleString('fa-IR')} میلیون تومان`;
        }
        return `${amount.toLocaleString('fa-IR')} ${currency}`;
    }
}

module.exports = new NotificationService();