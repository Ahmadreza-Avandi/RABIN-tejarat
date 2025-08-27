import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

// POST /api/voice-analysis/sahab-tts - Convert text to speech using Sahab API
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
        const { text, speaker = '3' } = body;

        if (!text || text.trim() === '') {
            return NextResponse.json(
                { success: false, message: 'متن برای تبدیل به صدا الزامی است' },
                { status: 400 }
            );
        }

        // Sahab API configuration
        const gatewayToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzeXN0ZW0iOiJzYWhhYiIsImNyZWF0ZVRpbWUiOiIxNDA0MDYwNDIxMTQ1NDgyNCIsInVuaXF1ZUZpZWxkcyI6eyJ1c2VybmFtZSI6ImU2ZTE2ZWVkLTkzNzEtNGJlOC1hZTBiLTAwNGNkYjBmMTdiOSJ9LCJncm91cE5hbWUiOiJkZjk4NTY2MTZiZGVhNDE2NGQ4ODMzZmRkYTUyOGUwNCIsImRhdGEiOnsic2VydmljZUlEIjoiZGY1M2E3ODAtMjE1OC00NTI0LTkyNDctYzZmMGJhZDNlNzcwIiwicmFuZG9tVGV4dCI6InJtWFJSIn19.6wao3Mps4YOOFh-Si9oS5JW-XZ9RHR58A1CWgM0DUCg';
        const apiUrl = 'https://partai.gw.isahab.ir/TextToSpeech/v1/speech-synthesys';

        console.log('🎵 Sahab TTS API Request:', {
            text: text.substring(0, 50) + '...',
            speaker,
            textLength: text.length
        });

        try {
            // Prepare headers
            const headers = new Headers();
            headers.append("Content-Type", "application/json");
            headers.append("gateway-token", gatewayToken);

            // Prepare request body
            const requestBody = {
                "data": text,
                "filePath": "true",
                "base64": "0",
                "checksum": "1",
                "speaker": speaker
            };

            // Make API request with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
                redirect: 'follow',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error('❌ Sahab API HTTP Error:', response.status, response.statusText);
                return NextResponse.json(
                    {
                        success: false,
                        message: `خطای API: ${response.status} - ${response.statusText}`,
                        error_code: 'HTTP_ERROR'
                    },
                    { status: response.status }
                );
            }

            // Parse response
            const result = await response.text();
            console.log('📥 Sahab API Raw Response:', result.substring(0, 200) + '...');

            let parsedResult;
            try {
                parsedResult = JSON.parse(result);
            } catch (parseError) {
                console.error('❌ Failed to parse Sahab API response:', parseError);
                return NextResponse.json(
                    {
                        success: false,
                        message: 'پاسخ API قابل تجزیه نیست',
                        error_code: 'PARSE_ERROR',
                        raw_response: result.substring(0, 500)
                    },
                    { status: 500 }
                );
            }

            // Check response structure - Sahab API has nested structure
            if (!parsedResult.data || parsedResult.data.status !== 'success') {
                const errorMessage = parsedResult.data?.error || parsedResult.error || 'خطای نامشخص در API';
                console.error('❌ Sahab API Error:', errorMessage);
                return NextResponse.json(
                    {
                        success: false,
                        message: `خطای API ساهاب: ${errorMessage}`,
                        error_code: 'API_ERROR',
                        api_response: parsedResult
                    },
                    { status: 400 }
                );
            }

            // Check if we have audio file path
            if (!parsedResult.data.data || !parsedResult.data.data.filePath) {
                console.error('❌ No audio file path in Sahab response:', parsedResult);
                return NextResponse.json(
                    {
                        success: false,
                        message: 'مسیر فایل صوتی در پاسخ یافت نشد',
                        error_code: 'NO_AUDIO_PATH',
                        api_response: parsedResult
                    },
                    { status: 500 }
                );
            }

            // Download the audio file and convert to base64
            const audioFilePath = parsedResult.data.data.filePath;
            const audioUrl = `https://${audioFilePath}`;

            console.log('🔄 Downloading audio file from:', audioUrl);

            try {
                const audioResponse = await fetch(audioUrl);
                if (!audioResponse.ok) {
                    throw new Error(`HTTP ${audioResponse.status}: ${audioResponse.statusText}`);
                }

                const audioBuffer = await audioResponse.arrayBuffer();
                const audioBase64 = Buffer.from(audioBuffer).toString('base64');

                console.log('✅ Audio file downloaded and converted to base64:', {
                    fileSize: audioBuffer.byteLength,
                    base64Length: audioBase64.length
                });

                // Return successful response with base64 audio
                return NextResponse.json({
                    success: true,
                    message: 'تبدیل متن به صدا با موفقیت انجام شد',
                    data: {
                        audioBase64: `data:audio/mp3;base64,${audioBase64}`,
                        checksum: parsedResult.data.data.checksum,
                        filePath: parsedResult.data.data.filePath,
                        speaker: speaker,
                        textLength: text.length,
                        requestId: parsedResult.meta?.requestId,
                        shamsiDate: parsedResult.meta?.shamsiDate
                    }
                });

            } catch (downloadError) {
                console.error('❌ Error downloading audio file:', downloadError);
                return NextResponse.json(
                    {
                        success: false,
                        message: 'خطا در دانلود فایل صوتی',
                        error_code: 'DOWNLOAD_ERROR',
                        error_details: downloadError.message
                    },
                    { status: 500 }
                );
            }



        } catch (fetchError) {
            console.error('❌ Sahab API Fetch Error:', fetchError);

            if (fetchError.name === 'AbortError') {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'درخواست به دلیل طولانی شدن زمان لغو شد',
                        error_code: 'TIMEOUT'
                    },
                    { status: 408 }
                );
            }

            return NextResponse.json(
                {
                    success: false,
                    message: 'خطا در ارتباط با سرویس صوتی',
                    error_code: 'NETWORK_ERROR',
                    error_details: fetchError.message
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('❌ Sahab TTS API Error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'خطای داخلی سرور',
                error_code: 'INTERNAL_ERROR'
            },
            { status: 500 }
        );
    }
}

// GET /api/voice-analysis/sahab-tts - Get available speakers
export async function GET(req: NextRequest) {
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

        // Return available speakers
        const speakers = [
            { id: '1', name: 'صدای 1', description: 'صدای مردانه', gender: 'male' },
            { id: '2', name: 'صدای 2', description: 'صدای زنانه', gender: 'female' },
            { id: '3', name: 'صدای 3', description: 'صدای زنانه (پیشفرض)', gender: 'female', default: true },
            { id: '4', name: 'صدای 4', description: 'صدای مردانه', gender: 'male' },
            { id: '5', name: 'صدای 5', description: 'صدای زنانه', gender: 'female' }
        ];

        return NextResponse.json({
            success: true,
            speakers: speakers,
            default_speaker: '3'
        });

    } catch (error) {
        console.error('❌ Get speakers API Error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت لیست صداها' },
            { status: 500 }
        );
    }
}