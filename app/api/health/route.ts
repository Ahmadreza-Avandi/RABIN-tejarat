import { NextRequest, NextResponse } from 'next/server';

// GET /api/health - Enhanced health check endpoint for VPS
export async function GET(req: NextRequest) {
    try {
        // Basic system info
        const healthData = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            vps_mode: process.env.VPS_MODE === 'true',
            services: {
                database: 'unknown', // Will be checked below
                audio: process.env.VPS_MODE === 'true' ? 'fallback' : 'enabled',
                sahab_api: process.env.SAHAB_API_KEY ? 'configured' : 'missing',
                fallback_mode: process.env.FALLBACK_MODE === 'true'
            },
            audio_config: {
                enabled: process.env.AUDIO_ENABLED !== 'false',
                vps_mode: process.env.VPS_MODE === 'true',
                fallback_text: process.env.AUDIO_FALLBACK_TEXT || 'گزارش احمد',
                pcm_sample_rate: process.env.PCM_SAMPLE_RATE || '16000',
                network_timeout: process.env.NETWORK_TIMEOUT || '30000'
            }
        };

        // Try to check database connection
        try {
            // Simple database check - we'll import the connection here
            const mysql = require('mysql2/promise');
            const connection = await mysql.createConnection({
                host: process.env.DATABASE_HOST || 'mysql',
                user: process.env.DATABASE_USER || 'crm_app_user',
                password: process.env.DATABASE_PASSWORD || '1234',
                database: process.env.DATABASE_NAME || 'crm_system',
                connectTimeout: 5000
            });

            await connection.execute('SELECT 1');
            await connection.end();
            healthData.services.database = 'connected';
        } catch (dbError) {
            console.warn('Database health check failed:', dbError);
            healthData.services.database = 'disconnected';
        }

        // Test Sahab API connectivity (quick test)
        if (process.env.SAHAB_API_KEY && process.env.VPS_MODE !== 'true') {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch('https://partai.gw.isahab.ir/speechRecognition/v1/base64', {
                    method: 'HEAD',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                healthData.services.sahab_api = response.ok ? 'available' : 'unavailable';
            } catch (error) {
                healthData.services.sahab_api = 'blocked';
            }
        }

        return NextResponse.json(healthData, { status: 200 });
    } catch (error) {
        console.error('Health check error:', error);
        return NextResponse.json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
            vps_mode: process.env.VPS_MODE === 'true'
        }, { status: 500 });
    }
}

// HEAD /api/health - Simple health check for load balancers
export async function HEAD(req: NextRequest) {
    return new NextResponse(null, { status: 200 });
}