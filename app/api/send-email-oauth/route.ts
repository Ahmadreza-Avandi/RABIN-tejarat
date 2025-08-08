import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
    try {
        const { to, subject, text, html } = await request.json();

        // تنظیم OAuth 2.0
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'http://localhost:3000/api/oauth-callback'
        );

        oAuth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });

        // دریافت Access Token
        const accessToken = await oAuth2Client.getAccessToken();

        // تنظیم Nodemailer با OAuth 2.0
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        } as any);

        // تنظیم ایمیل
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text,
            html: html || `
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
                        white-space: pre-line;
                    }
                    .email-footer {
                        background: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #eee;
                    }
                    .success-badge {
                        background: #28a745;
                        color: white;
                        padding: 5px 10px;
                        border-radius: 15px;
                        font-size: 14px;
                        display: inline-block;
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        <h1>🎉 سیستم مدیریت ارتباط با مشتری</h1>
                    </div>
                    <div class="email-body">
                        ${text}
                    </div>
                    <div class="email-footer">
                        <p>این پیام از سیستم مدیریت ارتباط با مشتری ارسال شده است</p>
                        <p>تاریخ ارسال: ${new Date().toLocaleDateString('fa-IR')}</p>
                    </div>
                </div>
            </body>
            </html>
            `
        };

        // ارسال ایمیل
        const result = await transporter.sendMail(mailOptions);

        return NextResponse.json({
            success: true,
            message: 'ایمیل با موفقیت ارسال شد',
            messageId: result.messageId
        });

    } catch (error: any) {
        console.error('خطا در ارسال ایمیل:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'خطا در ارسال ایمیل: ' + error.message
            },
            { status: 500 }
        );
    }
}