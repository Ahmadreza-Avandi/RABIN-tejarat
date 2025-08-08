import { NextRequest, NextResponse } from 'next/server';

// Import the Gmail API service
const gmailService = require('../../../../lib/gmail-api.js');

export async function POST(request: NextRequest) {
    try {
        const { emails, template, variables } = await request.json();

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({
                error: 'Missing or invalid emails array'
            }, { status: 400 });
        }

        // Validate each email object
        for (const email of emails) {
            if (!email.to || !email.subject) {
                return NextResponse.json({
                    error: 'Each email must have to and subject fields'
                }, { status: 400 });
            }
        }

        let results;

        if (template) {
            // Send template emails with different variables for each recipient
            const templateEmails = emails.map((email: any) => ({
                to: email.to,
                subject: email.subject,
                template: template,
                variables: { ...variables, ...email.variables }
            }));

            results = [];
            for (const email of templateEmails) {
                const result = await gmailService.sendTemplateEmail(
                    email.to,
                    email.subject,
                    email.template,
                    email.variables
                );
                results.push({
                    to: email.to,
                    success: result.success,
                    messageId: result.messageId,
                    error: result.error
                });

                // Small delay between emails
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } else {
            // Send bulk simple emails
            results = await gmailService.sendBulkEmails(emails);
        }

        const successCount = results.filter((r: any) => r.success).length;
        const failureCount = results.length - successCount;

        return NextResponse.json({
            success: true,
            totalSent: results.length,
            successCount,
            failureCount,
            results
        });

    } catch (error) {
        console.error('Bulk email API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}