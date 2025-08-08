import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';

// Import internal notification system
const notificationSystem = require('@/lib/notification-system.js');

// GET notifications
export async function GET(req: NextRequest) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const userId = req.headers.get('x-user-id');
        const type = searchParams.get('type'); // 'unread', 'history', 'count'
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        switch (type) {
            case 'unread':
                const unreadResult = await notificationSystem.getUnreadNotifications(userId, limit);
                return NextResponse.json(unreadResult);

            case 'history':
                const historyResult = await notificationSystem.getNotificationHistory(userId, limit || 30);
                return NextResponse.json(historyResult);

            case 'count':
                const countResult = await notificationSystem.getUnreadCount(userId);
                return NextResponse.json(countResult);

            default:
                // Default: return recent notifications (both read and unread)
                const notifications = await executeQuery(`
                    SELECT * FROM notifications 
                    WHERE user_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT ?
                `, [userId, limit]);

                return NextResponse.json({
                    success: true,
                    data: notifications
                });
        }
    } catch (error) {
        console.error('Error in notifications API:', error);
        return NextResponse.json({
            success: false,
            message: 'خطا در دریافت اعلان‌ها'
        }, { status: 500 });
    }
}

// POST - Create notification (for testing)
export async function POST(req: NextRequest) {
    try {
        const userId = req.headers.get('x-user-id');
        const body = await req.json();

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        const result = await notificationSystem.createNotification({
            userId: body.targetUserId || userId,
            type: body.type,
            title: body.title,
            message: body.message,
            relatedId: body.relatedId,
            relatedType: body.relatedType
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({
            success: false,
            message: 'خطا در ایجاد اعلان'
        }, { status: 500 });
    }
}

// PUT - Mark notifications as read
export async function PUT(req: NextRequest) {
    try {
        const userId = req.headers.get('x-user-id');
        const body = await req.json();

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        if (body.action === 'mark_all_read') {
            const result = await notificationSystem.markAllAsRead(userId);
            return NextResponse.json(result);
        } else if (body.notificationId) {
            const result = await notificationSystem.markAsRead(body.notificationId, userId);
            return NextResponse.json(result);
        } else {
            return NextResponse.json({
                success: false,
                message: 'پارامترهای نامعتبر'
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({
            success: false,
            message: 'خطا در به‌روزرسانی اعلان'
        }, { status: 500 });
    }
}