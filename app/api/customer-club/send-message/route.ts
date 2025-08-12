import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { executeQuery, executeSingle } from '@/lib/database';
import * as nodemailer from 'nodemailer';

// Generate UUID function
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};



export async function POST(req: NextRequest) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'توکن یافت نشد' },
                { status: 401 }
            );
        }

        const userId = await getUserFromToken(token);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { contactIds, message } = body;

        if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
            return NextResponse.json(
                { success: false, message: 'لیست مخاطبین نامعتبر است' },
                { status: 400 }
            );
        }

        if (!message || !message.content) {
            return NextResponse.json(
                { success: false, message: 'متن پیام الزامی است' },
                { status: 400 }
            );
        }

        // Get contacts information
        const placeholders = contactIds.map(() => '?').join(',');
        const contacts = await executeQuery(`
      SELECT c.*, cu.name as customer_name
      FROM contacts c
      LEFT JOIN customers cu ON c.company_id = cu.id
      WHERE c.id IN (${placeholders})
    `, contactIds);

        if (contacts.length === 0) {
            return NextResponse.json(
                { success: false, message: 'هیچ مخاطب معتبری یافت نشد' },
                { status: 400 }
            );
        }

        const results = {
            total: contacts.length,
            sent: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Send messages based on type
        if (message.type === 'email') {
            if (!message.subject) {
                return NextResponse.json(
                    { success: false, message: 'موضوع ایمیل الزامی است' },
                    { status: 400 }
                );
            }

            try {
                // Create test account for demo purposes
                let testAccount = await nodemailer.createTestAccount();

                // Create email transporter using Ethereal Email for testing
                const transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });

                // Test connection
                await transporter.verify();

                for (const contact of contacts) {
                    if (!contact.email) {
                        results.failed++;
                        results.errors.push(`${contact.name}: ایمیل موجود نیست`);
                        continue;
                    }

                    try {
                        // Personalize message content
                        const personalizedContent = message.content
                            .replace(/\{name\}/g, contact.name || 'کاربر گرامی')
                            .replace(/\{customer\}/g, contact.customer_name || '')
                            .replace(/\{role\}/g, contact.role || '')
                            .replace(/\{email\}/g, contact.email || '')
                            .replace(/\{phone\}/g, contact.phone || '')
                            .replace(/\{company\}/g, contact.customer_name || '');

                        // Create HTML email template using the new template system
                        const { generateEmailTemplate } = require('../../../../lib/email-template-helper.js');
                        const htmlContent = generateEmailTemplate(personalizedContent, message.subject);

                        const mailOptions = {
                            from: testAccount.user,
                            to: contact.email,
                            subject: message.subject,
                            text: personalizedContent,
                            html: htmlContent
                        };

                        const result = await transporter.sendMail(mailOptions);
                        results.sent++;

                        // Get preview URL for testing
                        const previewUrl = nodemailer.getTestMessageUrl(result);
                        console.log(`📧 Email sent to ${contact.email}. Preview: ${previewUrl}`);

                        // Log the sent message
                        await executeSingle(`
                            INSERT INTO message_logs (id, contact_id, user_id, type, subject, content, status, sent_at)
                            VALUES (?, ?, ?, 'email', ?, ?, 'sent', NOW())
                        `, [generateUUID(), contact.id, userId, message.subject, personalizedContent]);

                        // Add small delay between emails
                        await new Promise(resolve => setTimeout(resolve, 200));

                    } catch (error: any) {
                        console.error(`Error sending email to ${contact.email}:`, error);
                        results.failed++;
                        results.errors.push(`${contact.name}: ${error.message}`);

                        // Log the failed message
                        await executeSingle(`
                            INSERT INTO message_logs (id, contact_id, user_id, type, subject, content, status, sent_at)
                            VALUES (?, ?, ?, 'email', ?, ?, 'failed', NOW())
                        `, [generateUUID(), contact.id, userId, message.subject, message.content]);
                    }
                }

            } catch (error: any) {
                console.error('Error in email sending process:', error);
                return NextResponse.json(
                    { success: false, message: 'خطا در تنظیم یا ارسال ایمیل: ' + error.message },
                    { status: 500 }
                );
            }

        } else if (message.type === 'sms') {
            // SMS functionality - placeholder for future implementation
            return NextResponse.json(
                { success: false, message: 'سیستم پیامک هنوز راه‌اندازی نشده است' },
                { status: 400 }
            );
        }

        // Create campaign record
        const campaignId = generateUUID();
        await executeSingle(`
      INSERT INTO message_campaigns (id, user_id, title, type, content, total_recipients, sent_count, failed_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
            campaignId,
            userId,
            message.subject || 'پیام گروهی',
            message.type,
            message.content,
            results.total,
            results.sent,
            results.failed
        ]);

        return NextResponse.json({
            success: true,
            message: `پیام با موفقیت ارسال شد. ${results.sent} موفق، ${results.failed} ناموفق`,
            data: results
        });

    } catch (error) {
        console.error('Send message API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ارسال پیام' },
            { status: 500 }
        );
    }
}