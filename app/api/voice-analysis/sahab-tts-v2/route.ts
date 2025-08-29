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

        // Sahab API V2 configuration
        const gatewayToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzeXN0ZW0iOiJzYWhhYiIsImNyZWF0ZVRpbWUiOiIxNDA0MDYwNDIxMTQ1NDgyNCIsInVuaXF1ZUZpZWxkcyI6eyJ1c2VybmFtZSI6ImU2ZTE2ZWVkLTkzNzEtNGJlOC1hZTBiLTAwNGNkYjBmMTdiOSJ9LCJncm91cE5hbWUiOiJkZjk4NTY2MTZiZGVhNDE2NGQ4ODMzZmRkYTUyOGUwNCIsImRhdGEiOnsic2VydmljZUlEIjoiZGY1M2E3ODAtMjE1OC00NTI0LTkyNDctYzZmMGJhZDNlNzcwIiwicmFuZG9tVGV4dCI6InJtWFJSIn19.6wao3Mps4YOOFh-Si9oS5JW-XZ9RHR58A1CWgM0DUCg';
        const apiUrl = 'https://partai.gw.isahab.ir/TextToSpeech/v2/speech-synthesys';

        console.log('🎵 Sahab TTS V2 API Request:', {
            text: text.substring(0, 50) + '...',
            speaker,
            speed,
            pitch,
            textLength: text.length
        });

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${gatewayToken}`,
                },
                body: JSON.stringify({
                    text,
                    speaker,
                    speed,
                    pitch,
                    format: 'mp3'
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('📥 Sahab API V2 Raw Response:', JSON.stringify(data));

            if (data.data?.status === 'success' && data.data?.data?.filePath) {
                // Download the audio file
                const audioUrl = `https://${data.data.data.filePath}`;
                console.log('🔄 Downloading audio file from:', audioUrl);

                const audioResponse = await fetch(audioUrl);
                if (!audioResponse.ok) {
                    throw new Error(`Failed to download audio file: ${audioResponse.status}`);
                }

                const audioBuffer = await audioResponse.arrayBuffer();
                const base64Audio = Buffer.from(audioBuffer).toString('base64');

                console.log('✅ Audio file downloaded and converted to base64:', {
                    fileSize: audioBuffer.byteLength,
                    base64Length: base64Audio.length
                });

                return NextResponse.json({
                    success: true,
                    audioBase64: base64Audio,
                    format: 'mp3',
                    metadata: {
                        speaker,
                        speed,
                        pitch,
                        textLength: text.length
                    }
                });
            } else {
                throw new Error('Invalid API response format');
            }

        } catch (error) {
            console.error('❌ Error in Sahab TTS V2:', error);
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
