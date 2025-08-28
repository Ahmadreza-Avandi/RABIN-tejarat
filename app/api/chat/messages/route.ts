import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { getAuthUser, authErrorResponse } from '@/lib/auth-helper';

// Import notification services
const notificationService = require('@/lib/notification-service.js');
const internalNotificationSystem = require('@/lib/notification-system.js');

export async function GET(req: NextRequest) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const userId = searchParams.get('userId');
        const conversationId = searchParams.get('conversation_id');

        // Get authenticated user
        const user = getAuthUser(req);
        if (!user) {
            return NextResponse.json(authErrorResponse.unauthorized, { status: 401 });
        }

        const currentUserId = user.id;

        // If conversation_id is provided, get messages from that conversation
        if (conversationId) {
            const messages = await executeQuery(`
                SELECT 
                    m.*,
                    sender.name as sender_name,
                    receiver.name as receiver_name
                FROM chat_messages m
                JOIN users sender ON m.sender_id = sender.id
                LEFT JOIN users receiver ON m.receiver_id = receiver.id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at ASC
            `, [conversationId]);

            return NextResponse.json({
                success: true,
                data: messages
            });
        }

        // If userId is provided, get conversation between current user and specified user
        if (userId) {
            // First, find the conversation between these users
            const conversations = await executeQuery(`
                SELECT id FROM chat_conversations 
                WHERE (participant_1_id = ? AND participant_2_id = ?) 
                   OR (participant_1_id = ? AND participant_2_id = ?)
                LIMIT 1
            `, [currentUserId, userId, userId, currentUserId]);

            if (!conversations || conversations.length === 0) {
                return NextResponse.json({
                    success: true,
                    data: [],
                    message: 'هیچ مکالمه‌ای یافت نشد'
                });
            }

            const conversation = conversations[0];

            // Get messages from this conversation
            const messages = await executeQuery(`
                SELECT 
                    m.*,
                    sender.name as sender_name,
                    receiver.name as receiver_name
                FROM chat_messages m
                JOIN users sender ON m.sender_id = sender.id
                LEFT JOIN users receiver ON m.receiver_id = receiver.id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at ASC
            `, [conversation.id]);

            return NextResponse.json({
                success: true,
                data: messages
            });
        }

        // If no specific parameters, get recent messages for current user
        const recentMessages = await executeQuery(`
            SELECT 
                m.*,
                sender.name as sender_name,
                receiver.name as receiver_name,
                c.title as conversation_title
            FROM chat_messages m
            JOIN users sender ON m.sender_id = sender.id
            LEFT JOIN users receiver ON m.receiver_id = receiver.id
            JOIN chat_conversations c ON m.conversation_id = c.id
            WHERE c.participant_1_id = ? OR c.participant_2_id = ?
            ORDER BY m.created_at DESC
            LIMIT 50
        `, [currentUserId, currentUserId]);

        return NextResponse.json({
            success: true,
            data: recentMessages
        });

    } catch (error) {
        console.error('Get messages API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت پیام‌ها' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        // Get authenticated user
        const user = getAuthUser(req);
        if (!user) {
            return NextResponse.json(authErrorResponse.unauthorized, { status: 401 });
        }

        const currentUserId = user.id;

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

        if (messageType === 'file' && !fileUrl) {
            return NextResponse.json(
                { success: false, message: 'فایل الزامی است' },
                { status: 400 }
            );
        }

        // Generate UUID for message
        const messageId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        let conversationId = providedConversationId;

        // If no conversation ID provided, find or create conversation
        if (!conversationId) {
            console.log('🔍 Looking for existing conversation between:', currentUserId, 'and', receiverId);

            const existingConversations = await executeQuery(`
                SELECT id FROM chat_conversations 
                WHERE (participant_1_id = ? AND participant_2_id = ?) 
                   OR (participant_1_id = ? AND participant_2_id = ?)
                LIMIT 1
            `, [currentUserId, receiverId, receiverId, currentUserId]);

            if (existingConversations && existingConversations.length > 0) {
                conversationId = existingConversations[0].id;
                console.log('✅ Found existing conversation:', conversationId);
            } else {
                // Create new conversation
                conversationId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });

                console.log('🆕 Creating new conversation:', conversationId);

                await executeQuery(`
                    INSERT INTO chat_conversations (
                        id, participant_1_id, participant_2_id, title, created_by, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                `, [conversationId, currentUserId, receiverId, `مکالمه ${new Date().toLocaleDateString('fa-IR')}`, currentUserId]);

                console.log('✅ New conversation created successfully');
            }
        }

        console.log('🔍 Final conversation ID:', conversationId);

        if (!conversationId) {
            console.error('❌ Conversation ID is still null!');
            return NextResponse.json(
                { success: false, message: 'خطا در ایجاد مکالمه' },
                { status: 500 }
            );
        }

        // Insert the message
        await executeQuery(`
            INSERT INTO chat_messages (
                id, conversation_id, sender_id, receiver_id, message, message_type,
                file_url, file_name, file_size, reply_to_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            messageId, conversationId, currentUserId, receiverId, message, messageType,
            fileUrl, fileName, fileSize, replyToId
        ]);

        // Update conversation's updated_at
        await executeQuery(`
            UPDATE chat_conversations 
            SET updated_at = NOW() 
            WHERE id = ?
        `, [conversationId]);

        // Get the created message with sender info
        const newMessage = await executeSingle(`
            SELECT 
                m.*,
                sender.name as sender_name,
                receiver.name as receiver_name
            FROM chat_messages m
            JOIN users sender ON m.sender_id = sender.id
            LEFT JOIN users receiver ON m.receiver_id = receiver.id
            WHERE m.id = ?
        `, [messageId]);

        // Send notifications
        try {
            // Get receiver info
            const receiver = await executeSingle(`
                SELECT name, email FROM users WHERE id = ?
            `, [receiverId]);

            if (receiver) {
                // Internal notification
                await internalNotificationSystem.createNotification({
                    userId: receiverId,
                    type: 'chat_message',
                    title: 'پیام جدید',
                    message: `پیام جدید از ${user.email}`,
                    data: {
                        senderId: currentUserId,
                        conversationId: conversationId,
                        messageId: messageId
                    }
                });

                // External notification (email/SMS)
                await notificationService.sendChatNotification({
                    receiverEmail: receiver.email,
                    receiverName: receiver.name,
                    senderName: user.email,
                    message: message || 'فایل ارسال شده',
                    conversationId: conversationId
                });
            }
        } catch (notificationError) {
            console.error('Notification error:', notificationError);
            // Don't fail the message sending if notification fails
        }

        return NextResponse.json({
            success: true,
            data: newMessage,
            message: 'پیام ارسال شد'
        });

    } catch (error) {
        console.error('Send message API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ارسال پیام' },
            { status: 500 }
        );
    }
}