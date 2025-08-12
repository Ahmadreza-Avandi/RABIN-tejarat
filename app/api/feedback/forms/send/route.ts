import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Import the Gmail API service
const gmailService = require('../../../../../lib/gmail-api.js');

// POST /api/feedback/forms/send - Send a feedback form to a customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formId, customerId, customerEmail, customerName } = body;

    if (!formId || !customerId || !customerEmail) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات ارسال فرم کامل نیست' },
        { status: 400 }
      );
    }

    // Check if form exists
    const forms = await executeQuery(`
      SELECT * FROM feedback_forms
      WHERE id = ? AND status = 'active'
    `, [formId]);

    if (forms.length === 0) {
      return NextResponse.json(
        { success: false, message: 'فرم بازخورد فعال یافت نشد' },
        { status: 404 }
      );
    }

    const form = forms[0];

    // Generate a unique token for this submission
    const token = crypto.randomBytes(32).toString('hex');
    const submissionId = uuidv4();

    // Create a submission record
    await executeSingle(`
      INSERT INTO feedback_form_submissions (
        id, form_id, customer_id, status, token, created_at
      ) VALUES (?, ?, ?, 'pending', ?, NOW())
    `, [submissionId, formId, customerId, token]);

    // Create the feedback form URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const feedbackUrl = `${baseUrl}/feedback/form/${token}`;

    // Try Gmail API first, fallback to nodemailer
    let emailResult;
    
    try {
      // Initialize Gmail API if not already done
      if (!gmailService.gmail) {
        console.log('🔧 Initializing Gmail API...');
        const initResult = await gmailService.initializeFromEnv();
        if (!initResult) {
          throw new Error('Gmail API not configured');
        }
      }

      // Create email content
      const emailSubject = form.type === 'sales' 
        ? 'نظرسنجی درباره فرآیند فروش' 
        : 'نظرسنجی درباره محصول';

      const emailContent = `
        <div style="direction: rtl; text-align: right; font-family: Tahoma, Arial, sans-serif;">
          <h2>${customerName} عزیز</h2>
          <p>با سلام و احترام</p>
          <p>از اینکه به ما اعتماد کردید سپاسگزاریم. نظر شما برای ما بسیار ارزشمند است.</p>
          <p>لطفا با تکمیل فرم زیر، ما را در بهبود خدمات یاری کنید:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${feedbackUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              تکمیل فرم نظرسنجی
            </a>
          </div>
          <p>با تشکر از همکاری شما</p>
          <p>تیم پشتیبانی مشتریان</p>
        </div>
      `;

      // Send the email
      emailResult = await gmailService.sendEmail({
        to: customerEmail,
        subject: emailSubject,
        html: emailContent
      });
    } catch (error) {
      console.log('⚠️ Gmail API failed, trying nodemailer fallback...');
      
      // Fallback to nodemailer
      const { emailService } = await import('@/lib/email');
      
      // Create email content
      const emailSubject = form.type === 'sales' 
        ? 'نظرسنجی درباره فرآیند فروش' 
        : 'نظرسنجی درباره محصول';

      const emailContent = `
        <div style="direction: rtl; text-align: right; font-family: Tahoma, Arial, sans-serif;">
          <h2>${customerName} عزیز</h2>
          <p>با سلام و احترام</p>
          <p>از اینکه به ما اعتماد کردید سپاسگزاریم. نظر شما برای ما بسیار ارزشمند است.</p>
          <p>لطفا با تکمیل فرم زیر، ما را در بهبود خدمات یاری کنید:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${feedbackUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              تکمیل فرم نظرسنجی
            </a>
          </div>
          <p>با تشکر از همکاری شما</p>
          <p>تیم پشتیبانی مشتریان</p>
        </div>
      `;

      emailResult = await emailService.sendEmail({
        to: customerEmail,
        subject: emailSubject,
        html: emailContent
      });
    }

    if (emailResult.success) {
      // Update the submission record with the message ID
      await executeSingle(`
        UPDATE feedback_form_submissions
        SET email_message_id = ?
        WHERE id = ?
      `, [emailResult.messageId, submissionId]);

      return NextResponse.json({
        success: true,
        message: 'فرم بازخورد با موفقیت ارسال شد',
        data: {
          submissionId,
          token,
          feedbackUrl
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'خطا در ارسال ایمیل',
        error: emailResult.error
      }, { status: 500 });
    }
    } catch (error) {
      console.error('Send feedback form API error:', error);

      // If Gmail API failed due to connection refused, fallback to nodemailer
      if (error.message && error.message.includes('ECONNREFUSED')) {
        try {
          const { emailService } = await import('@/lib/email');

          const emailSubject = form.type === 'sales' 
            ? 'نظرسنجی درباره فرآیند فروش' 
            : 'نظرسنجی درباره محصول';

          const emailContent = `
            <div style="direction: rtl; text-align: right; font-family: Tahoma, Arial, sans-serif;">
              <h2>${customerName} عزیز</h2>
              <p>با سلام و احترام</p>
              <p>از اینکه به ما اعتماد کردید سپاسگزاریم. نظر شما برای ما بسیار ارزشمند است.</p>
              <p>لطفا با تکمیل فرم زیر، ما را در بهبود خدمات یاری کنید:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${feedbackUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  تکمیل فرم نظرسنجی
                </a>
              </div>
              <p>با تشکر از همکاری شما</p>
              <p>تیم پشتیبانی مشتریان</p>
            </div>
          `;

          const emailResult = await emailService.sendEmail({
            to: customerEmail,
            subject: emailSubject,
            html: emailContent
          });

          if (emailResult.success) {
            await executeSingle(`
              UPDATE feedback_form_submissions
              SET email_message_id = ?
              WHERE id = ?
            `, [emailResult.messageId, submissionId]);

            return NextResponse.json({
              success: true,
              message: 'فرم بازخورد با موفقیت ارسال شد',
              data: {
                submissionId,
                token,
                feedbackUrl
              }
            });
          } else {
            return NextResponse.json({
              success: false,
              message: 'خطا در ارسال ایمیل',
              error: emailResult.error
            }, { status: 500 });
          }
        } catch (fallbackError) {
          console.error('Fallback email send failed:', fallbackError);
          return NextResponse.json(
            { success: false, message: 'خطا در ارسال فرم بازخورد' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        { success: false, message: 'خطا در ارسال فرم بازخورد' },
        { status: 500 }
      );
    }
}