import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Simple health check
        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'CRM System'
        });
    } catch (error) {
        return NextResponse.json(
            { status: 'error', message: 'Service unavailable' },
            { status: 500 }
        );
    }
}