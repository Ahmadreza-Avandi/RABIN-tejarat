import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

// POST /api/voice-analysis/sahab-tts-v2 - Convert text to speech using Sahab API V2
export async function POST(req: NextRequest) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'توکن یافت نشد' },
                { status: 401 }
            );
        }

        const userId = await getUserFromToken(token);

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { text, speaker = '3', speed = 1.0, pitch = 1.0 } = body;

        if (!text || text.trim() === '') {
            return NextResponse.json(
                { success: false, message: 'متن برای تبدیل به صدا الزامی است' },
                { status: 400 }
            );
        }

        // Sahab API V2 configuration - use env provided TTS token and upstream host
        const gatewayToken = process.env.TTS_TOKEN || process.env.SAHAB_TTS_TOKEN;
        const upstreamHost = process.env.SPEECH_UPSTREAM_HOST || 'https://api.ahmadreza-avandi.ir';
        const apiUrl = `${upstreamHost.replace(/\/$/, '')}/text-to-speech`;

        console.log('🎵 Sahab TTS V2 API Request:', {
            text: text.substring(0, 50) + '...',
            speaker,
            speed,
            pitch,
            textLength: text.length
        });

        try {
            // Optional client API key enforcement
            const clientApiKey = req.headers.get('x-api-key');
            if (process.env.REQUIRE_CLIENT_API_KEY === '1') {
                const expected = process.env.CLIENT_API_KEY;
                if (!expected || clientApiKey !== expected) {
                    return NextResponse.json({ success: false, message: 'Unauthorized (missing x-api-key)' }, { status: 401 });
                }
            }

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (gatewayToken) headers['gateway-token'] = gatewayToken;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ text, speaker, speed, pitch, filePath: 'true', base64: '0' }),
            });

            // Read upstream response body as text so we can log it even when it's not valid JSON
            const upstreamStatus = response.status;
            const upstreamText = await response.text();
            let upstreamBody: any = upstreamText;
            try {
                upstreamBody = JSON.parse(upstreamText);
            } catch (e) {
                // keep as raw text
            }

            console.log('📥 Sahab API V2 Raw Response:', { status: upstreamStatus, body: upstreamBody });

            if (!response.ok) {
                // Return upstream body to client for debugging (502) and log full details
                console.error('🔻 Upstream returned non-OK status for TTS:', { status: upstreamStatus, body: upstreamBody });
                return NextResponse.json({
                    success: false,
                    message: 'Upstream TTS error',
                    upstream: { status: upstreamStatus, body: upstreamBody }
                }, { status: 502 });
            }

            const data = upstreamBody;

            // Support two upstream modes:
            // 1) returns data.data.data.filePath (a path, sometimes without https)
            // 2) returns data.data.data.base64 (direct base64 audio)
            const upData = data?.data?.data;
            const base64FromUpstream = upData?.base64;
            const filePathFromUpstream = upData?.filePath;

            if (base64FromUpstream) {
                console.log('✅ Upstream returned base64 audio directly');
                return NextResponse.json({
                    success: true,
                    audioBase64: base64FromUpstream,
                    format: 'mp3',
                    metadata: { speaker, speed, pitch, textLength: text.length }
                });
            }

            if (filePathFromUpstream) {
                // Normalize filePath — upstream may return without protocol
                let filePath = String(filePathFromUpstream || '').trim();
                if (!filePath.startsWith('http://') && !filePath.startsWith('https://')) {
                    filePath = `https://${filePath}`;
                }

                // Prepare a response that includes the direct audio URL so the client can fetch it
                const audioUrl = filePath;
                const baseResponse = {
                    success: true,
                    data: {
                        audioUrl,
                    },
                    format: 'mp3',
                    metadata: {
                        speaker,
                        speed,
                        pitch,
                        textLength: text.length,
                        upstreamFilePath: filePathFromUpstream
                    }
                } as any;

                console.log('🔄 Upstream provided filePath (normalized):', audioUrl);

                // Try to download server-side, but if network is unreachable, return audioUrl so client can attempt
                try {
                    console.log('🔄 Attempting server-side download of audio file from:', audioUrl);
                    const audioResponse = await fetch(audioUrl);
                    const audioStatus = audioResponse.status;
                    if (!audioResponse.ok) {
                        const audioText = await audioResponse.text().catch(() => '<binary or unreadable body>');
                        console.error('🔻 Failed to download audio file from upstream:', { status: audioStatus, body: audioText });
                        // Return audioUrl to client to try fetching directly
                        baseResponse.note = 'server_failed_to_download_audio, client_may_fetch_audioUrl_directly';
                        return NextResponse.json(baseResponse, { status: 200 });
                    }

                    const audioBuffer = await audioResponse.arrayBuffer();
                    const base64Audio = Buffer.from(audioBuffer).toString('base64');

                    console.log('✅ Audio file downloaded and converted to base64:', {
                        fileSize: audioBuffer.byteLength,
                        base64Length: base64Audio.length,
                        originalFilePath: filePathFromUpstream
                    });

                    // Return binary as base64 when download succeeded
                    return NextResponse.json({
                        success: true,
                        data: {
                            audioBase64: base64Audio,
                            audioUrl
                        },
                        format: 'mp3',
                        metadata: baseResponse.metadata
                    });

                } catch (downloadError) {
                    console.error('❌ Server-side audio download error (will return audioUrl to client):', downloadError);
                    baseResponse.note = 'server_error_when_downloading_audio';
                    return NextResponse.json(baseResponse, { status: 200 });
                }
            }

            console.error('🔻 Invalid API response format from upstream TTS:', { body: data });
            return NextResponse.json({ success: false, message: 'Invalid API response format', upstream: data }, { status: 502 });

        } catch (error) {
            console.error('❌ Error in Sahab TTS V2:', error);

            const errAny = error as any;
            if (errAny && (errAny.code === 'ENETUNREACH' || String(errAny).includes('ENETUNREACH') || String(errAny).includes('fetch failed'))) {
                console.warn('⚠️ Upstream TTS unreachable, returning fallback response to client');

                // Return a structured fallback that client-side SahabTTS can detect and fallback to TalkBot or local TTS
                return NextResponse.json({
                    success: false,
                    fallback: true,
                    message: 'Upstream TTS unreachable, use client-side fallback',
                    data: {
                        provider: 'upstream-unreachable',
                        recommended_fallback: 'talkbot' // client can switch to talkbot-tts
                    }
                }, { status: 502 });
            }

            throw error;
        }

    } catch (error) {
        console.error('❌ Error in Sahab TTS V2 endpoint:', error);
        return NextResponse.json(
            { success: false, message: `متأسفم، خطایی رخ داد: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}
