import { NextRequest, NextResponse } from 'next/server';

// Import the Gmail API service
const gmailService = require('../../../../lib/gmail-api.js');

export async function POST(request: NextRequest) {
    try {
        const requestData = await request.json();
        const { to, subject, message, template, variables, type = 'simple' } = requestData;

        console.log('📧 Email API Request:', {
            to,
            subject,
            message: message ? 'Present' : 'Missing',
            template: template ? 'Present' : 'Missing',
            type,
            variables
        });

        if (!to || !subject) {
            return NextResponse.json({
                error: 'Missing required fields: to, subject'
            }, { status: 400 });
        }

        if (!message && !template) {
            return NextResponse.json({
                error: 'Either message or template is required'
            }, { status: 400 });
        }

        // Initialize Gmail API if not already done
        if (!gmailService.gmail) {
            console.log('🔧 Initializing Gmail API...');
            const initResult = await gmailService.initializeFromEnv();
            if (!initResult) {
                return NextResponse.json({
                    success: false,
                    error: 'Failed to initialize Gmail API'
                }, { status: 500 });
            }
        }

        let result;

        if (type === 'template' && template) {
            // Send template email
            result = await gmailService.sendTemplateEmail(to, subject, template, variables || {});
        } else {
            // Send simple email
            result = await gmailService.sendEmail({
                to,
                subject,
                html: message || template
            });
        }

        if (result.success) {
            return NextResponse.json({
                success: true,
                messageId: result.messageId,
                message: 'Email sent successfully'
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Email API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}