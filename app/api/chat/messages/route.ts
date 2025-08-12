import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';

// Import notification services
const notificationService = require('@/lib/notification-service.js');
const internalNotificationSystem = require('@/lib/notification-system.js');

export async function GET(req: NextRequest) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const userId = searchParams.get('userId');
        const conversationId = searchParams.get('conversation_id');
        const currentUserId = req.headers.get('x-user-id');

        if (!currentUserId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // If conversation_id is provided, get messages from that conversation
        if (conversationId) {
            const messages = await executeQuery(`
                SELECT 
                    m.*,
                    sender.name as sender_name,
                    receiver.name as receiver_name
                FROM chat_messages m
                JOIN users sender ON m.sender_id = sender.id
                JOIN users receiver ON m.receiver_id = receiver.id
                WHERE m.id IN (
                    SELECT cm.id FROM chat_messages cm
                    JOIN chat_conversations cc ON cc.last_message_id = cm.id
                    WHERE cc.id = ?
                )
                ORDER BY m.created_at ASC
                LIMIT 100
            `, [conversationId]);

            return NextResponse.json({ success: true, data: messages });
        }

        // If userId is provided, get direct messages between users
        if (userId) {
            const messages = await executeQuery(`
                SELECT 
                    m.*,
                    sender.name as sender_name,
                    sender.email as sender_email,
                    receiver.name as receiver_name,
                    receiver.email as receiver_email,
                    reply_to.message as reply_to_message,
                    reply_to.sender_id as reply_to_sender_id,
                    reply_sender.name as reply_to_sender_name
                FROM chat_messages m
                JOIN users sender ON m.sender_id = sender.id
                JOIN users receiver ON m.receiver_id = receiver.id
                LEFT JOIN chat_messages reply_to ON m.reply_to_id = reply_to.id
                LEFT JOIN users reply_sender ON reply_to.sender_id = reply_sender.id
                WHERE (m.sender_id = ? AND m.receiver_id = ?)
                   OR (m.sender_id = ? AND m.receiver_id = ?)
                   AND m.is_deleted = FALSE
                ORDER BY m.created_at ASC
                LIMIT 100
            `, [currentUserId, userId, userId, currentUserId]);

            // به‌روزرسانی وضعیت خوانده شدن پیام‌ها (فقط اگر پیام خوانده نشده وجود داشته باشد)
            const unreadCount = await executeSingle(`
                SELECT COUNT(*) as count FROM chat_messages
                WHERE receiver_id = ? AND sender_id = ? AND read_at IS NULL
            `, [currentUserId, userId]);

            if (unreadCount && unreadCount.count > 0) {
                await executeSingle(`
                    UPDATE chat_messages
                    SET read_at = CURRENT_TIMESTAMP
                    WHERE receiver_id = ?
                      AND sender_id = ?
                      AND read_at IS NULL
                `, [currentUserId, userId]);
            }

            return NextResponse.json({ success: true, data: messages });
        }

        // If no specific parameters, return recent messages for current user
        const messages = await executeQuery(`
            SELECT 
                m.*,
                sender.name as sender_name,
                receiver.name as receiver_name
            FROM chat_messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE m.sender_id = ? OR m.receiver_id = ?
            ORDER BY m.created_at DESC
            LIMIT 50
        `, [currentUserId, currentUserId]);

        return NextResponse.json({ success: true, data: messages });
    } catch (error) {
        console.error('Error in chat messages API:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت پیام‌ها' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const currentUserId = req.headers.get('x-user-id');
        const {
            receiverId,
            message,
            messageType = 'text',
            fileUrl = null,
            fileName = null,
            fileSize = null,
            conversationId: providedConversationId = null,
            replyToId = null
        } = await req.json();

        if (!currentUserId || !receiverId) {
            return NextResponse.json(
                { success: false, message: 'پارامترهای ناقص' },
                { status: 400 }
            );
        }

        // Validate message content based on type
        if (messageType === 'text' && !message?.trim()) {
            return NextResponse.json(
                { success: false, message: 'متن پیام الزامی است' },
                { status: 400 }
            );
        }

        if ((messageType === 'image' || messageType === 'file') && !fileUrl) {
            return NextResponse.json(
                { success: false, message: 'فایل الزامی است' },
                { status: 400 }
            );
        }

        // Check for existing conversation or create new one
        let conversationId = providedConversationId;
        if (!conversationId) {
            const [existingConversation] = await executeQuery(`
                SELECT c.id 
                FROM chat_conversations c
                JOIN chat_participants p1 ON c.id = p1.conversation_id
                JOIN chat_participants p2 ON c.id = p2.conversation_id
                WHERE c.type = 'direct'
                AND ((p1.user_id = ? AND p2.user_id = ?)
                     OR (p1.user_id = ? AND p2.user_id = ?))
                LIMIT 1
            `, [currentUserId, receiverId, receiverId, currentUserId]);

            if (existingConversation) {
                conversationId = existingConversation.id;
            } else {
                // Create new conversation ID (UUID format)
                conversationId = 'cnv-' + Date.now().toString(36).substring(-6);

                await executeSingle(`
                    INSERT INTO chat_conversations (id, type, created_by) 
                    VALUES (?, 'direct', ?)
                `, [conversationId, currentUserId]);

                // Add participants
                await executeSingle(`
                    INSERT INTO chat_participants (id, conversation_id, user_id, role)
                    VALUES 
                        (UUID(), ?, ?, 'admin'),
                        (UUID(), ?, ?, 'member')
                `, [conversationId, currentUserId, conversationId, receiverId]);
            }
        }

        // Generate message ID (UUID format)
        const messageId = 'msg-' + Date.now().toString(36).substring(-6);
        // Insert the message (remove delivered_at, seen_at)
        await executeSingle(`
            INSERT INTO chat_messages (
                id, conversation_id, sender_id, receiver_id,
                message_type, message, file_url, file_name, file_size,
                reply_to_id, sent_at
            ) VALUES (
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, NOW()
            )
        `, [
            messageId, conversationId, currentUserId, receiverId,
            messageType, message, fileUrl, fileName, fileSize,
            replyToId
        ]);

        // Update conversation's last message - simplified
        await executeSingle(`
            UPDATE chat_conversations 
            SET last_message_id = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [messageId, conversationId]);

        // Update last message in separate query
        await executeSingle(`
            UPDATE chat_conversations 
            SET last_message = ?
            WHERE id = ?
        `, [message || 'فایل', conversationId]);

        // Send notifications for new message
        try {
            // const notificationService = require('../../../lib/notification-service-v2.js');
            const notificationService = require('@/lib/notification-service.js');

            // Get receiver info for notification
            const receiverInfo = await executeQuery(`
                SELECT name, email, phone FROM users WHERE id = ?
            `, [receiverId]);

            console.log('🔍 Receiver info for notification:', receiverInfo);

            if (receiverInfo && receiverInfo.length > 0) {
                const receiver = receiverInfo[0];
                const senderInfo = await executeQuery(`
                    SELECT name FROM users WHERE id = ?
                `, [currentUserId]);

                const senderName = senderInfo && senderInfo.length > 0 ? senderInfo[0].name : 'کاربر';

                console.log('📧 Notification details:', {
                    receiverEmail: receiver.email,
                    receiverPhone: receiver.phone,
                    receiverName: receiver.name,
                    senderName: senderName,
                    messageLength: message?.length || 0
                });

                // Send SMS notification if phone number exists
                if (receiver.phone) {
                    console.log('📱 Sending SMS notification to:', receiver.phone);
                    const smsResult = await notificationService.sendNewMessageSMS(
                        receiver.phone,
                        receiver.name,
                        senderName,
                        message
                    );
                    console.log('📱 SMS notification result:', smsResult);
                } else {
                    console.log('⚠️ No phone number for SMS notification');
                }

                // Send email notification if email exists
                if (receiver.email) {
                    console.log('📧 Sending email notification to:', receiver.email);
                    const emailResult = await notificationService.sendNewMessageEmail(
                        receiver.email,
                        receiver.name,
                        senderName,
                        message
                    );
                    console.log('📧 Email notification result:', emailResult);
                } else {
                    console.log('⚠️ No email address for email notification');
                }
            }
        } catch (notificationError) {
            console.error('Notification error:', notificationError);
            // Don't fail the message sending if notification fails
        }

        return NextResponse.json({
            success: true,
            data: {
                messageId,
                conversationId,
                sent: true
            }
        });
    } catch (error) {
        console.error('Error in chat/messages POST:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ارسال پیام' },
            { status: 500 }
        );
    }
}
