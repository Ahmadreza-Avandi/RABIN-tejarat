import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('🎤 Local Speech API called');

        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

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

        // For now, we'll implement a simple fallback that returns a placeholder
        // In a real implementation, you could use:
        // 1. A local Whisper model
        // 2. Google Speech-to-Text API
        // 3. Azure Speech Services
        // 4. Other speech recognition services

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For demo purposes, return a sample Persian text
        // In production, you'd implement actual speech recognition
        const sampleTexts = [
            'گزارش کار امروز',
            'تحلیل فروش ماه گذشته',
            'بازخورد مشتریان',
            'آمار سودآوری',
            'گزارش همکاران'
        ];

        const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];

        console.log('✅ Local speech processing completed (demo mode)');

        return NextResponse.json({
            success: true,
            text: randomText,
            provider: 'local-demo',
            language: 'fa',
            note: 'این یک نسخه آزمایشی است. برای استفاده واقعی، سرویس تشخیص گفتار باید پیکربندی شود.'
        });

    } catch (error) {
        console.error('❌ Error in Local Speech API:', error);

        return NextResponse.json(
            {
                error: 'خطا در پردازش محلی صدا',
                details: error instanceof Error ? error.message : 'خطای نامشخص'
            },
            { status: 500 }
        );
    }
}