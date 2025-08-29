import { NextRequest, NextResponse } from 'next/server';

// GET /api/health - Health check endpoint
export async function GET(req: NextRequest) {
    try {
        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            services: {
                database: 'connected', // TODO: Add actual DB check
                audio: process.env.VPS_MODE === 'true' ? 'fallback' : 'enabled',
                sahab_api: process.env.SAHAB_API_KEY ? 'configured' : 'missing'
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Health check error:', error);
        return NextResponse.json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// HEAD /api/health - Simple health check for load balancers
export async function HEAD(req: NextRequest) {
    return new NextResponse(null, { status: 200 });
}