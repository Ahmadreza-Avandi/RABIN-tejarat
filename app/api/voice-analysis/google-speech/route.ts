import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('🎤 Google Speech API called');

        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        const language = formData.get('language') as string || 'fa-IR';

        if (!audioFile) {
            return NextResponse.json(
                { error: 'فایل صوتی ارسال نشده است' },
                { status: 400 }
            );
        }

        console.log('📁 Audio file received:', {
            name: audioFile.name,
            size: audioFile.size,
            type: audioFile.type,
            language
        });

        // Check if Google Cloud API key is available
        const googleApiKey = process.env.GOOGLE_CLOUD_API_KEY;
        if (!googleApiKey) {
            console.warn('⚠️ Google Cloud API key not found');
            return NextResponse.json(
                { error: 'Google Cloud API key not configured' },
                { status: 503 }
            );
        }

        // Convert audio file to base64
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        // Prepare request for Google Speech-to-Text API
        const requestBody = {
            config: {
                encoding: 'WEBM_OPUS', // or 'LINEAR16', 'MP3', etc.
                sampleRateHertz: 16000,
                languageCode: language,
                alternativeLanguageCodes: ['fa', 'en-US'],
                enableAutomaticPunctuation: true,
                enableWordTimeOffsets: false,
                model: 'latest_long' // Use latest model for better accuracy
            },
            audio: {
                content: base64Audio
            }
        };

        console.log('🔄 Sending to Google Speech-to-Text...');

        // Call Google Speech-to-Text API
        const response = await fetch(
            `https://speech.googleapis.com/v1/speech:recognize?key=${googleApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Google Speech API error:', response.status, errorText);

            return NextResponse.json(
                {
                    error: 'خطا در سرویس Google Speech',
                    details: errorText,
                    status: response.status
                },
                { status: response.status }
            );
        }

        const result = await response.json();
        console.log('✅ Google Speech result:', result);

        // Extract transcript from response
        let transcript = '';
        if (result.results && result.results.length > 0) {
            transcript = result.results
                .map((r: any) => r.alternatives[0]?.transcript || '')
                .join(' ')
                .trim();
        }

        console.log('📝 Extracted transcript:', transcript);

        return NextResponse.json({
            success: true,
            transcript: transcript,
            provider: 'google-speech',
            language: language,
            confidence: result.results?.[0]?.alternatives?.[0]?.confidence || 0,
            fullResponse: result
        });

    } catch (error) {
        console.error('❌ Error in Google Speech API:', error);

        return NextResponse.json(
            {
                error: 'خطا در پردازش صدا با Google Speech',
                details: error instanceof Error ? error.message : 'خطای نامشخص'
            },
            { status: 500 }
        );
    }
}