import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { executeQuery, executeSingle } from '@/lib/database';

// Generate UUID function
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Helper function to get file extension
const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
};

// Helper function to determine file type
const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    return 'file';
};

// Allowed file types and max sizes
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
    'video/mp4',
    'video/avi',
    'video/mov',
    'audio/mp3',
    'audio/wav',
    'audio/ogg'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
    try {
        const currentUserId = req.headers.get('x-user-id');
        if (!currentUserId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const messageId = formData.get('messageId') as string;

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'فایل انتخاب نشده است' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: 'نوع فایل مجاز نیست' },
                { status: 400 }
            );
        }

        // Validate file size
        const maxSize = ALLOWED_IMAGE_TYPES.includes(file.type) ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
        if (file.size > maxSize) {
            const maxSizeMB = maxSize / (1024 * 1024);
            return NextResponse.json(
                { success: false, message: `حجم فایل نباید بیشتر از ${maxSizeMB}MB باشد` },
                { status: 400 }
            );
        }

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const fileExtension = getFileExtension(file.name);
        const uniqueFilename = `${generateUUID()}.${fileExtension}`;
        const filePath = path.join(uploadDir, uniqueFilename);
        const publicPath = `/uploads/chat/${uniqueFilename}`;

        // Save file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Save file info to database if messageId is provided
        let attachmentId = null;
        if (messageId) {
            attachmentId = generateUUID();
            await executeSingle(`
                INSERT INTO chat_attachments (
                    id, message_id, file_name, file_path, file_size, 
                    file_type, mime_type, uploaded_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                attachmentId,
                messageId,
                file.name,
                publicPath,
                file.size,
                getFileType(file.type),
                file.type,
                currentUserId
            ]);
        }

        return NextResponse.json({
            success: true,
            message: 'فایل با موفقیت آپلود شد',
            data: {
                id: attachmentId,
                filename: file.name,
                path: publicPath,
                size: file.size,
                type: getFileType(file.type),
                mimeType: file.type
            }
        });

    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در آپلود فایل' },
            { status: 500 }
        );
    }
}

// GET endpoint to retrieve file info
export async function GET(req: NextRequest) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const messageId = searchParams.get('messageId');

        if (!messageId) {
            return NextResponse.json(
                { success: false, message: 'شناسه پیام الزامی است' },
                { status: 400 }
            );
        }

        const attachments = await executeQuery(`
            SELECT 
                ca.*,
                u.name as uploader_name
            FROM chat_attachments ca
            JOIN users u ON ca.uploaded_by = u.id
            WHERE ca.message_id = ?
            ORDER BY ca.created_at ASC
        `, [messageId]);

        return NextResponse.json({
            success: true,
            data: attachments
        });

    } catch (error) {
        console.error('Get attachments error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت فایل‌ها' },
            { status: 500 }
        );
    }
}