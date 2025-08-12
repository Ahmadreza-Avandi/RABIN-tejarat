import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { receiverEmail, receiverPhone, receiverName, senderName, message } = await request.json();

        if (!receiverEmail && !receiverPhone) {
            return NextResponse.json({
                success: false,
                error: 'حداقل ایمیل یا شماره تلفن گیرنده الزامی است'
            }, { status: 400 });
        }

        console.log('🧪 Testing chat notification...');

        const notificationService = require('../../../lib/notification-service-v2.js');

        // Initialize notification service
        const initResult = await notificationService.initialize();
        console.log('📧 Notification service initialized:', initResult);

        const results = {
            email: null,
            sms: null
        };

        // Test email notification
        if (receiverEmail) {
            console.log('📧 Testing email notification to:', receiverEmail);
            const emailResult = await notificationService.sendNewMessageEmail(
                receiverEmail,
                receiverName || 'کاربر تست',
                senderName || 'فرستنده تست',
                message || 'این یک پیام تست است'
            );
            results.email = emailResult;
            console.log('📧 Email result:', emailResult);
        }

        // Test SMS notification
        if (receiverPhone) {
            console.log('📱 Testing SMS notification to:', receiverPhone);
            const smsResult = await notificationService.sendNewMessageSMS(
                receiverPhone,
                receiverName || 'کاربر تست',
                senderName || 'فرستنده تست',
                message || 'این یک پیام تست است'
            );
            results.sms = smsResult;
            console.log('📱 SMS result:', smsResult);
        }

        return NextResponse.json({
            success: true,
            message: 'تست notification انجام شد',
            results: results
        });

    } catch (error: any) {
        console.error('❌ Test chat notification error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'خطا در تست notification'
        }, { status: 500 });
    }
}