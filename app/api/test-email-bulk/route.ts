import { NextRequest, NextResponse } from 'next/server';

// Import the Gmail API service
const gmailService = require('../../../lib/gmail-api.js');

export async function POST(request: NextRequest) {
    try {
        const requestData = await request.json();
        const { emails, template, variables } = requestData;

        console.log('📧 Bulk Email API Request:', {
            emailCount: emails?.length || 0,
            template: template ? 'Present' : 'Missing',
            variables
        });

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({
                error: 'Missing or empty emails array'
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

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const email of emails) {
            try {
                let result;

                if (template) {
                    // Send template email
                    result = await gmailService.sendTemplateEmail(
                        email.to,
                        email.subject,
                        template,
                        { ...variables, ...email.variables }
                    );
                } else {
                    // Send simple email
                    result = await gmailService.sendEmail({
                        to: email.to,
                        subject: email.subject,
                        html: email.message || template
                    });
                }

                if (result.success) {
                    successCount++;
                    results.push({
                        to: email.to,
                        success: true,
                        messageId: result.messageId
                    });
                } else {
                    failureCount++;
                    results.push({
                        to: email.to,
                        success: false,
                        error: result.error
                    });
                }
            } catch (error: any) {
                failureCount++;
                results.push({
                    to: email.to,
                    success: false,
                    error: error.message
                });
            }
        }

        return NextResponse.json({
            success: successCount > 0,
            successCount,
            failureCount,
            totalCount: emails.length,
            results,
            message: `${successCount} emails sent successfully, ${failureCount} failed`
        });

    } catch (error: any) {
        console.error('Bulk Email API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}