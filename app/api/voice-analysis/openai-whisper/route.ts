import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('🎤 OpenAI Whisper API called');

        const formData = await request.formData();
        const audioFile = formData.get('file') as File;

        if (!audioFile) {
            return NextResponse.json(
                { error: 'فایل صوتی ارسال نشده است' },
                { status: 400 }
            );
        }

        console.log('📁 Audio file received:', {
            name: audioFile.name,
            size: audioFile.size,
            type: audioFile.type
        });

        // Check if OpenAI API key is available
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            console.warn('⚠️ OpenAI API key not found, using fallback');
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 503 }
            );
        }

        // Prepare form data for OpenAI
        const openaiFormData = new FormData();
        openaiFormData.append('file', audioFile);
        openaiFormData.append('model', 'whisper-1');
        openaiFormData.append('language', 'fa'); // Persian
        openaiFormData.append('response_format', 'json');

        console.log('🔄 Sending to OpenAI Whisper...');

        // Call OpenAI Whisper API
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: openaiFormData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ OpenAI API error:', response.status, errorText);

            return NextResponse.json(
                {
                    error: 'خطا در سرویس OpenAI',
                    details: errorText,
                    status: response.status
                },
                { status: response.status }
            );
        }

        const result = await response.json();
        console.log('✅ OpenAI Whisper result:', result.text?.substring(0, 100) + '...');

        return NextResponse.json({
            success: true,
            text: result.text || '',
            provider: 'openai-whisper',
            language: 'fa'
        });

    } catch (error) {
        console.error('❌ Error in OpenAI Whisper API:', error);

        return NextResponse.json(
            {
                error: 'خطا در پردازش صدا',
                details: error instanceof Error ? error.message : 'خطای نامشخص'
            },
            { status: 500 }
        );
    }
}