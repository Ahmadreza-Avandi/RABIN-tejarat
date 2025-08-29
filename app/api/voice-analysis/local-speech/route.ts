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

        // For demo purposes, return a more realistic text based on common commands
        // In production, you'd implement actual speech recognition

        // Try to guess based on audio file size and common patterns
        let predictedText = 'گزارش خودم'; // Default to personal report

        // Simple heuristic based on file size (larger files might be longer commands)
        if (audioFile.size > 100000) {
            predictedText = 'گزارش کار احمد';
        } else if (audioFile.size > 80000) {
            predictedText = 'تحلیل فروش';
        } else if (audioFile.size > 60000) {
            predictedText = 'گزارش خودم';
        }

        console.log('🔮 Predicted text based on heuristics:', predictedText);

        console.log('✅ Local speech processing completed (demo mode)');

        return NextResponse.json({
            success: true,
            text: predictedText,
            provider: 'local-demo',
            language: 'fa',
            confidence: 0.6, // Lower confidence for demo
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